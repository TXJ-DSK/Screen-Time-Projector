import { useState } from 'react';

import type { ExtractedScreenTimeData } from '../types/domain';
import { minutesToReadable, toDateKey } from '../utils/date';

interface UploadPanelProps {
  isSaving: boolean;
  saveError: string | null;
  onExtract: (
    file: File,
    startDate: string,
    endDate: string,
    daysInRange: number,
    totalAverageMinutes: number,
  ) => Promise<ExtractedScreenTimeData>;
  onSave: (data: ExtractedScreenTimeData) => Promise<void>;
}

export default function UploadPanel({
  isSaving,
  saveError,
  onExtract,
  onSave,
}: UploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
  const [totalAverageMinutes, setTotalAverageMinutes] = useState<string>('480');

  function onFileInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setExtractedData(null);
    setExtractionError(null);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);

    const nextFile = event.dataTransfer.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setExtractedData(null);
    setExtractionError(null);
  }

  function calculateDaysInRange(): number {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, diffDays);
  }

  async function extractData(): Promise<void> {
    if (!selectedFile) {
      setExtractionError('Choose an image before extracting screen-time data.');
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

    const totalMinutes = parseInt(totalAverageMinutes, 10);
    if (isNaN(totalMinutes) || totalMinutes <= 0) {
      setExtractionError('Please enter a valid total screen time (in minutes).');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractionError(null);
      const daysInRange = calculateDaysInRange();
      const data = await onExtract(
        selectedFile,
        startDate,
        endDate,
        daysInRange,
        totalMinutes,
      );
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
          Drag and drop your screen-time screenshot, select the date range, and extract
          app usage data.
        </p>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p>{selectedFile ? selectedFile.name : 'Drop image here or choose a file'}</p>
        <label className="file-picker" htmlFor="screenshot-file">
          Select screenshot
        </label>
        <input
          id="screenshot-file"
          type="file"
          accept="image/*"
          onChange={onFileInputChange}
        />
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

        <div className="input-group">
          <label htmlFor="total-minutes">Average Total Screen Time (minutes):</label>
          <input
            id="total-minutes"
            type="number"
            value={totalAverageMinutes}
            min="1"
            onChange={(e) => setTotalAverageMinutes(e.target.value)}
          />
        </div>

        <p className="muted">
          Date range: {daysInRange} day{daysInRange !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={extractData}
          disabled={isExtracting || isSaving}
        >
          {isExtracting ? 'Extracting...' : 'Extract app usage'}
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
          <h3>Extracted App Usage</h3>
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
          <h4>Applications (daily average):</h4>
          <ul>
            {extractedData.applications.map((app) => (
              <li key={app.name}>
                <span>{app.name}</span>
                <span>{minutesToReadable(app.minutesSpent)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {extractionError && <p className="error-text">{extractionError}</p>}
      {saveError && <p className="error-text">{saveError}</p>}
    </section>
  );
}
