'use client';

import React, { useState, useRef } from 'react';
import { Task } from '@/lib/types';
import { parseCSV, parseJSON } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ImportFormProps {
  onImport: (tasks: Task[]) => void;
  onCancel: () => void;
}

export default function ImportForm({
  onImport,
  onCancel
}: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Vérifier le type de fichier
    if (importType === 'csv' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }
    
    if (importType === 'json' && !selectedFile.name.toLowerCase().endsWith('.json')) {
      setError('Veuillez sélectionner un fichier JSON');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  const handleImport = () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let tasks: Task[] = [];
        
        if (importType === 'csv') {
          tasks = parseCSV(content);
        } else {
          tasks = parseJSON(content);
        }
        
        if (tasks.length === 0) {
          setError('Aucune tâche trouvée dans le fichier');
          return;
        }
        
        onImport(tasks);
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        setError(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Format invalide'}`);
      }
    };
    
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier');
    };
    
    reader.readAsText(file);
  };
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Card title="Importer des tâches">
      <div className="space-y-4">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format d&apos;import
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  value="csv"
                  checked={importType === 'csv'}
                  onChange={() => setImportType('csv')}
                />
                <span className="ml-2">CSV</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  value="json"
                  checked={importType === 'json'}
                  onChange={() => setImportType('json')}
                />
                <span className="ml-2">JSON</span>
              </label>
            </div>
          </div>
          
          <input
            type="file"
            accept={importType === 'csv' ? '.csv' : '.json'}
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-2">
              {file ? file.name : `Glissez-déposez votre fichier ${importType.toUpperCase()} ici ou`}
            </p>
            <Button onClick={handleFileSelect} variant="outline" size="sm">
              Sélectionner un fichier
            </Button>
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        {importType === 'csv' && (
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Format CSV attendu:</p>
            <pre className="bg-gray-100 p-2 rounded">
              Nom,Durée,Prédécesseurs
              Tâche 1,5,
              Tâche 2,3,Tâche 1
              Tâche 3,7,"Tâche 1;Tâche 2"
            </pre>
          </div>
        )}
        
        {importType === 'json' && (
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Format JSON attendu:</p>
            <pre className="bg-gray-100 p-2 rounded">
              {`{
  "tasks": [
    {
      "id": "A",
      "name": "Tâche 1",
      "duration": 5,
      "predecessors": []
    },
    {
      "id": "B",
      "name": "Tâche 2",
      "duration": 3,
      "predecessors": ["A"]
    }
  ]
}`}
            </pre>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button onClick={onCancel} variant="outline">
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={!file}>
            Importer
          </Button>
        </div>
      </div>
    </Card>
  );
}