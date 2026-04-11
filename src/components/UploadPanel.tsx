import { useState } from 'react';

import type { ExtractedScreenTimeData } from '../types/domain';
import { minutesToReadable } from '../utils/date';

interface UploadPanelProps {
  isSaving: boolean;
  saveError: string | null;
  onExtract: (file: File) => Promise<ExtractedScreenTimeData>;
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

  async function extractData(): Promise<void> {
    if (!selectedFile) {
      setExtractionError('Choose an image before extracting screen-time data.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractionError(null);
      const data = await onExtract(selectedFile);
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

  return (
    <section className="panel upload-panel">
      <div className="panel-head">
        <h2>Daily Screenshot Upload</h2>
        <p className="muted">
          Drag and drop your screen-time screenshot, then extract and store it.
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

      <div className="upload-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={extractData}
          disabled={isExtracting || isSaving}
        >
          {isExtracting ? 'Extracting...' : 'Extract screen-time'}
        </button>

        <button
          type="button"
          className="ghost-btn"
          onClick={saveData}
          disabled={!extractedData || isSaving || isExtracting}
        >
          {isSaving ? 'Saving...' : 'Save daily log'}
        </button>
      </div>

      {extractedData && (
        <div className="extraction-preview">
          <h3>Extracted Usage</h3>
          <p>
            Date: <strong>{extractedData.dateKey}</strong>
          </p>
          <p>
            Total: <strong>{minutesToReadable(extractedData.totalMinutes)}</strong>
          </p>
          <ul>
            {extractedData.categories.map((category) => (
              <li key={category.name}>
                <span>{category.name}</span>
                <span>{minutesToReadable(category.minutesSpent)}</span>
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
