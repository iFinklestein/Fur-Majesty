import React, { useState, useEffect, useCallback } from "react";
import { VaccineRecord } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { User } from "@/api/entities";
import {
  Shield,
  Plus,
  Upload,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
  FileText,
  Image
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Safe date formatter that handles YYYY-MM-DD strings
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // Handle both old ISO format and new YYYY-MM-DD format
  if (dateStr.includes('T') || dateStr.endsWith('Z')) {
    // Legacy format - convert carefully
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }
  
  // Format YYYY-MM-DD string without timezone shifts
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Check if date is near expiry
const getExpiryStatus = (expiresOn) => {
  if (!expiresOn) return null;
  
  const expiry = new Date(expiresOn + 'T00:00:00');
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  if (expiry < now) {
    return { status: 'expired', color: 'destructive' };
  } else if (expiry < thirtyDaysFromNow) {
    return { status: 'expires-soon', color: 'warning' };
  }
  return { status: 'valid', color: 'secondary' };
};

export default function VaccineRecords({ petId, vaccines: initialVaccines = [], onUpdate }) {
  const [vaccines, setVaccines] = useState(initialVaccines);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    dateGiven: "",
    expiresOn: "",
    file: null,
    fileUrl: "",
    fileName: "",
    fileType: ""
  });

  // Update internal state when initialVaccines prop changes
  useEffect(() => {
    setVaccines(initialVaccines);
  }, [initialVaccines]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const vaccineData = {
        petId,
        title: formData.title,
        dateGiven: formData.dateGiven, // Store as YYYY-MM-DD string
        expiresOn: formData.expiresOn || null, // Store as YYYY-MM-DD string
        fileUrl: formData.fileUrl,
        fileName: formData.fileName,
        fileType: formData.fileType
      };
      await VaccineRecord.create(vaccineData);
      if (onUpdate) onUpdate();
      resetForm();
    } catch (error) {
      console.error("Error saving vaccine record:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      dateGiven: "",
      expiresOn: "",
      file: null,
      fileUrl: "",
      fileName: "",
      fileType: ""
    });
    setShowAddDialog(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      alert("File size must be under 3MB");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        fileUrl: file_url,
        fileName: file.name,
        fileType: file.type
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (vaccineId) => {
    if (window.confirm("Are you sure you want to delete this vaccine record?")) {
      try {
        await VaccineRecord.delete(vaccineId);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Error deleting vaccine:", error);
      }
    }
  };

  const handleViewFile = (vaccine) => {
    setViewingFile(vaccine);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Vaccine Records
        </h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Upload Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Vaccine Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Vaccine Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Rabies, DHPP"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateGiven">Date Given *</Label>
                  <Input
                    id="dateGiven"
                    type="date"
                    value={formData.dateGiven}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateGiven: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiresOn">Expires On</Label>
                  <Input
                    id="expiresOn"
                    type="date"
                    value={formData.expiresOn}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresOn: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Upload File (Image or PDF)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="vaccine-file"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="vaccine-file"
                    className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : formData.fileName || 'Choose file (JPG, PNG, PDF)'}
                  </label>
                  {formData.fileName && (
                    <p className="text-sm text-green-600 mt-2">✓ {formData.fileName}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-500"
                  disabled={!formData.fileUrl}
                >
                  Save Record
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {vaccines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">No vaccine records</h4>
            <p className="text-gray-600 mb-4">Upload vaccination certificates and records</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vaccines.map((vaccine) => {
            const expiryStatus = getExpiryStatus(vaccine.expiresOn);
            const isImage = vaccine.fileType?.startsWith('image/');
            
            return (
              <Card key={vaccine.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isImage ? (
                          <Image className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-500" />
                        )}
                        <h4 className="font-semibold">{vaccine.title}</h4>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Given {formatDate(vaccine.dateGiven)}
                        </div>
                        
                        {vaccine.expiresOn && expiryStatus && (
                          <Badge 
                            variant={expiryStatus.color}
                            className={`${
                              expiryStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
                              expiryStatus.status === 'expires-soon' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {expiryStatus.status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {expiryStatus.status === 'expired' ? 'Expired' :
                             expiryStatus.status === 'expires-soon' ? `Expires ${formatDate(vaccine.expiresOn).replace(/, \d{4}$/, '')}` :
                             'Valid'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFile(vaccine)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vaccine.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* File Viewer Dialog */}
      {viewingFile && (
        <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingFile.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {viewingFile.fileType?.startsWith('image/') ? (
                <img
                  src={viewingFile.fileUrl}
                  alt={viewingFile.title}
                  className="w-full h-auto max-h-96 object-contain rounded-lg border"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">PDF files cannot be previewed</p>
                  <Button asChild>
                    <a href={viewingFile.fileUrl} target="_blank" rel="noopener noreferrer">
                      Open PDF
                    </a>
                  </Button>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p>Date Given: {formatDate(viewingFile.dateGiven)}</p>
                {viewingFile.expiresOn && (
                  <p>Expires: {formatDate(viewingFile.expiresOn)}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}