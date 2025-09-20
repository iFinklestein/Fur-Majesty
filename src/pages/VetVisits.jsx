
import React, { useState, useEffect } from "react";
import { VetVisit } from "@/api/entities";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { format } from "date-fns";
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  MapPin,
  FileText,
  Upload,
  X,
  Edit,
  Trash2
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { groupBy } from "lodash";
import { scheduleGenerateTodayTasks } from "@/components/utils/taskGenerator";

export default function VetVisits() {
  const [vetVisits, setVetVisits] = useState([]);
  const [pets, setPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    petId: "",
    date: "",
    clinicName: "",
    reason: "",
    notes: "",
    attachments: [],
    followUpDate: "",
    cost: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const [vetData, petData] = await Promise.all([
        VetVisit.filter({ created_by: user.email }, '-date'),
        Pet.filter({ created_by: user.email }, '-created_date')
      ]);
      setVetVisits(vetData);
      setPets(petData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = vetVisits.filter(visit => {
    const pet = pets.find(p => p.id === visit.petId);
    return (
      visit.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet && pet.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const groupedVisits = groupBy(filteredVisits, visit => new Date(visit.date).getFullYear());
  const sortedYears = Object.keys(groupedVisits).sort((a, b) => b - a);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined
      };
      if (editingVisit) {
        await VetVisit.update(editingVisit.id, submitData);
      } else {
        await VetVisit.create(submitData);
      }
      await loadData();
      scheduleGenerateTodayTasks(); // Debounced task generation
      resetForm();
    } catch (error) {
      console.error("Error saving vet visit:", error);
    }
  };

  const handleEdit = (visit) => {
    setEditingVisit(visit);
    setFormData({
      ...visit,
      date: visit.date ? format(new Date(visit.date), 'yyyy-MM-dd') : "",
      followUpDate: visit.followUpDate ? format(new Date(visit.followUpDate), 'yyyy-MM-dd') : ""
    });
    setShowAddDialog(true);
  };
  
  const handleDelete = async (visitId) => {
    if (window.confirm("Are you sure you want to delete this vet visit? This action cannot be undone.")) {
      try {
        await VetVisit.delete(visitId);
        await loadData();
        scheduleGenerateTodayTasks(); // Debounced task generation
      } catch (error) {
        console.error("Error deleting vet visit:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      petId: "",
      date: "",
      clinicName: "",
      reason: "",
      notes: "",
      attachments: [],
      followUpDate: "",
      cost: ""
    });
    setEditingVisit(null);
    setShowAddDialog(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return { name: file.name, url: file_url };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles]
      }));
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Veterinary Visits</h1>
            <p className="text-gray-600 mt-1">Track your pets' medical appointments and care</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            setShowAddDialog(isOpen);
          }}>
            <DialogTrigger asChild>
              <Button 
                disabled={pets.length === 0}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vet Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingVisit ? 'Edit Vet Visit' : 'Add New Vet Visit'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="petId">Pet *</Label>
                    <Select
                      value={formData.petId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, petId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Visit Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="clinicName">Veterinary Clinic *</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                    placeholder="Enter clinic name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Visit *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Annual checkup, vaccination, illness"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Visit Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Findings, recommendations, observations..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Attachments</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload documents, photos, lab results'}
                    </label>
                    
                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        {formData.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{attachment.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-blue-500">
                    {editingVisit ? 'Save Changes' : 'Add Vet Visit'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {pets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600 mb-4">Add a pet first to track veterinary visits</p>
              <Button variant="outline">
                Go to Pets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Visits List */}
            {filteredVisits.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No visits found' : 'No vet visits recorded'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Start tracking your pets\' medical care'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Visit
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedYears.map(year => (
                  <div key={year}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{year}</h2>
                    <div className="space-y-4">
                      {groupedVisits[year].map((visit) => {
                        const pet = pets.find(p => p.id === visit.petId);
                        return (
                          <Card key={visit.id} className="hover:shadow-md transition-shadow group">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {pet?.photoUrl ? (
                                    <Avatar className="w-12 h-12">
                                      <AvatarImage src={pet.photoUrl} />
                                      <AvatarFallback>{pet.name[0]}</AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-200 to-blue-200 rounded-full flex items-center justify-center">
                                      <Stethoscope className="w-6 h-6 text-green-700" />
                                    </div>
                                  )}
                                  <div>
                                    <CardTitle className="text-lg">{pet?.name || 'Unknown Pet'}</CardTitle>
                                    <p className="text-sm text-gray-600">{visit.reason}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2 mb-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(visit)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(visit.id)}>
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                  <Badge variant="outline" className="mb-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(visit.date), 'MMM d, yyyy')}
                                  </Badge>
                                  {visit.cost && (
                                    <p className="text-sm font-medium text-green-600">
                                      ${visit.cost.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{visit.clinicName}</span>
                              </div>
                              
                              {visit.notes && (
                                <div className="flex items-start gap-2 text-sm">
                                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-gray-700">{visit.notes}</p>
                                </div>
                              )}

                              {visit.attachments && visit.attachments.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                  {visit.attachments.map((attachment, index) => (
                                    <a
                                      key={index}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                    >
                                      📎 {attachment.name}
                                    </a>
                                  ))}
                                </div>
                              )}

                              {visit.followUpDate && (
                                <Badge variant="secondary" className="w-fit">
                                  Follow-up: {format(new Date(visit.followUpDate), 'MMM d, yyyy')}
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
