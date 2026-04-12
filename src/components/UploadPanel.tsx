import { useState } from 'react';

import {
  extractApplicationsFromImage,
  extractCategoriesFromImage,
} from '../services/visionService';
import type { ExtractedScreenTimeData } from '../types/domain';
import { minutesToReadable, toDateKey } from '../utils/date';

interface UploadPanelProps {
  isSaving: boolean;
  saveError: string | null;
  onSave: (data: ExtractedScreenTimeData) => Promise<void>;
}

export default function UploadPanel({ isSaving, saveError, onSave }: UploadPanelProps) {
  const [appScreenshotFile, setAppScreenshotFile] = useState<File | null>(null);
  const [categoryScreenshotFile, setCategoryScreenshotFile] = useState<File | null>(null);
  const [isDraggingApp, setIsDraggingApp] = useState(false);
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedScreenTimeData | null>(
    null,
  );

  const today = new Date();
  const todayKey = toDateKey(today);
  const sevenDaysAgoKey = toDateKey(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState<string>(sevenDaysAgoKey);
  const [endDate, setEndDate] = useState<string>(todayKey);
  const [totalAverageHours, setTotalAverageHours] = useState<string>('8');
  const [totalAverageMinutesInput, setTotalAverageMinutesInput] = useState<string>('0');

  const handleAppDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingApp(true);
  };

  const handleAppDragLeave = () => {
    setIsDraggingApp(false);
  };

  const handleAppDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingApp(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      setAppScreenshotFile(files[0]);
      setExtractedData(null);
      setExtractionError(null);
    }
  };

  const handleAppFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      setAppScreenshotFile(files[0]);
      setExtractedData(null);
      setExtractionError(null);
    }
  };

  const handleCategoryDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCategory(true);
  };

  const handleCategoryDragLeave = () => {
    setIsDraggingCategory(false);
  };

  const handleCategoryDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCategory(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      setCategoryScreenshotFile(files[0]);
      setExtractedData(null);
      setExtractionError(null);
    }
  };

  const handleCategoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      setCategoryScreenshotFile(files[0]);
      setExtractedData(null);
      setExtractionError(null);
    }
  };

  function calculateDaysInRange(): number {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, diffDays);
  }

  async function extractData(): Promise<void> {
    if (!appScreenshotFile && !categoryScreenshotFile) {
      setExtractionError(
        'Upload at least one screenshot (app or category) before extracting.',
      );
      return;
    }

    if (!startDate || !endDate) {
      setExtractionError('Please select both start and end dates.');
      return;
    }

    if (new Date(`${startDate}T00:00:00`) > new Date(`${endDate}T00:00:00`)) {
      setExtractionError('Start date must be before or equal to end date.');
      return;
    }

    if (new Date(`${endDate}T00:00:00`) > today) {
      setExtractionError('End date cannot be in the future.');
      return;
    }

    const hours = parseInt(totalAverageHours, 10) || 0;
    const minutes = parseInt(totalAverageMinutesInput, 10) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0) {
      setExtractionError('Please enter a valid total screen time.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractionError(null);

      const daysInRange = calculateDaysInRange();

      // Extract both apps and categories in parallel
      const [applications, categories] = await Promise.all([
        appScreenshotFile
          ? extractApplicationsFromImage(appScreenshotFile)
          : Promise.resolve([]),
        categoryScreenshotFile
          ? extractCategoriesFromImage(categoryScreenshotFile)
          : Promise.resolve([]),
      ]);

      const data: ExtractedScreenTimeData = {
        startDate,
        endDate,
        daysInRange,
        totalAverageMinutes: totalMinutes,
        applications,
        categories,
      };

      setExtractedData(data);
    } catch (error) {
      setExtractionError(
        error instanceof Error
          ? error.message
          : 'Failed to extract screenshot data from the vision API.',
      );
    } finally {
      setIsExtracting(false);
    }
  }

  async function saveData(): Promise<void> {
    if (!extractedData) {
      return;
    }

    await onSave(extractedData);
  }

  const daysInRange = calculateDaysInRange();

  return (
    <section className="panel upload-panel">
      <div className="panel-head">
        <h2>Screenshot Upload</h2>
        <p className="muted">
          Upload screenshots of app and category screen-time data, select the date range,
          input your average daily screen time, and extract usage data.
        </p>
      </div>

      <div className="upload-section">
        <h3>Application Usage</h3>
        <div
          className={`dropzone ${isDraggingApp ? 'dropzone-active' : ''}`}
          onDragOver={handleAppDragOver}
          onDragLeave={handleAppDragLeave}
          onDrop={handleAppDrop}
        >
          <p>{appScreenshotFile ? appScreenshotFile.name : 'Drop app screenshot here'}</p>
          <label className="file-picker" htmlFor="app-screenshot-file">
            Select app screenshot
          </label>
          <input
            id="app-screenshot-file"
            type="file"
            accept="image/*"
            onChange={handleAppFileSelect}
          />
        </div>
      </div>

      <div className="upload-section">
        <h3>Category Usage</h3>
        <div
          className={`dropzone ${isDraggingCategory ? 'dropzone-active' : ''}`}
          onDragOver={handleCategoryDragOver}
          onDragLeave={handleCategoryDragLeave}
          onDrop={handleCategoryDrop}
        >
          <p>
            {categoryScreenshotFile
              ? categoryScreenshotFile.name
              : 'Drop category screenshot here'}
          </p>
          <label className="file-picker" htmlFor="category-screenshot-file">
            Select category screenshot
          </label>
          <input
            id="category-screenshot-file"
            type="file"
            accept="image/*"
            onChange={handleCategoryFileSelect}
          />
        </div>
      </div>

      <div className="date-range-inputs">
        <div className="input-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            max={todayKey}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            max={todayKey}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <p className="muted">
          Date range: {daysInRange} day{daysInRange !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="average-time-inputs">
        <fieldset>
          <legend>Average Total Screen Time</legend>
          <div className="time-inputs">
            <div className="input-group">
              <label htmlFor="total-hours">Hours:</label>
              <input
                id="total-hours"
                type="number"
                value={totalAverageHours}
                min="0"
                max="23"
                onChange={(e) => setTotalAverageHours(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="total-minutes">Minutes:</label>
              <input
                id="total-minutes"
                type="number"
                value={totalAverageMinutesInput}
                min="0"
                max="59"
                onChange={(e) => setTotalAverageMinutesInput(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={extractData}
          disabled={isExtracting || isSaving}
        >
          {isExtracting ? 'Extracting...' : 'Extract usage data'}
        </button>

        <button
          type="button"
          className="ghost-btn"
          onClick={saveData}
          disabled={!extractedData || isSaving || isExtracting}
        >
          {isSaving ? 'Saving...' : 'Save logs'}
        </button>
      </div>

      {extractedData && (
        <div className="extraction-preview">
          <h3>Extracted Data</h3>
          <p>
            Date Range: <strong>{extractedData.startDate}</strong> to{' '}
            <strong>{extractedData.endDate}</strong>
          </p>
          <p>
            Days: <strong>{extractedData.daysInRange}</strong>
          </p>
          <p>
            Average Total:{' '}
            <strong>{minutesToReadable(extractedData.totalAverageMinutes)}</strong>
          </p>

          {extractedData.applications.length > 0 && (
            <>
              <h4>Applications (daily average):</h4>
              <ul>
                {extractedData.applications.map((app) => (
                  <li key={app.name}>
                    <span>{app.name}</span>
                    <span>{minutesToReadable(app.minutesSpent)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {extractedData.categories.length > 0 && (
            <>
              <h4>Categories (daily average):</h4>
              <ul>
                {extractedData.categories.map((cat) => (
                  <li key={cat.name}>
                    <span>{cat.name}</span>
                    <span>{minutesToReadable(cat.minutesSpent)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {extractionError && <p className="error-text">{extractionError}</p>}
      {saveError && <p className="error-text">{saveError}</p>}
    </section>
  );
}
