
import React, { useState, useEffect } from "react";
import { Medication } from "@/api/entities";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import { format, isAfter, isBefore, addDays } from "date-fns";
import {
  Pill,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  Edit, // Added Edit icon
  Trash2 // Added Trash2 icon
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MedTakenToggle from "../components/medications/MedTakenToggle";
import { generateTodayTasks, scheduleGenerateTodayTasks } from "@/components/utils/taskGenerator"; // Added scheduleGenerateTodayTasks

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [pets, setPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMed, setEditingMed] = useState(null); // State to hold medication being edited
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    petId: "",
    name: "",
    dose: "",
    unit: "mg",
    route: "oral",
    frequency: "once_daily",
    startDate: "",
    endDate: "",
    refillByDate: "",
    notes: "",
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const [medData, petData] = await Promise.all([
        Medication.filter({ created_by: user.email }, '-created_date'),
        Pet.filter({ created_by: user.email }, '-created_date')
      ]);
      setMedications(medData);
      setPets(petData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = medications.filter(med => {
    const pet = pets.find(p => p.id === med.petId);
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet && pet.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "active" && med.isActive) ||
      (filterStatus === "inactive" && !med.isActive);

    return matchesSearch && matchesFilter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMed) {
        await Medication.update(editingMed.id, formData);
      } else {
        await Medication.create(formData);
      }
      await loadData();
      scheduleGenerateTodayTasks(); // Debounced task generation
      resetForm();
    } catch (error) {
      console.error("Error saving medication:", error);
    }
  };

  const handleEdit = (med) => {
    setEditingMed(med);
    // Format dates to YYYY-MM-DD for input type="date" compatibility
    setFormData({
      ...med,
      startDate: med.startDate ? format(new Date(med.startDate), 'yyyy-MM-dd') : "",
      endDate: med.endDate ? format(new Date(med.endDate), 'yyyy-MM-dd') : "",
      refillByDate: med.refillByDate ? format(new Date(med.refillByDate), 'yyyy-MM-dd') : ""
    });
    setShowAddDialog(true);
  };
  
  const handleDelete = async (medId) => {
    if (window.confirm("Are you sure you want to delete this medication? This action cannot be undone.")) {
      try {
        await Medication.delete(medId);
        await loadData();
        scheduleGenerateTodayTasks(); // Debounced task generation
      } catch (error) {
        console.error("Error deleting medication:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      petId: "",
      name: "",
      dose: "",
      unit: "mg",
      route: "oral",
      frequency: "once_daily",
      startDate: "",
      endDate: "",
      refillByDate: "",
      notes: "",
      isActive: true
    });
    setEditingMed(null); // Clear editing state
    setShowAddDialog(false);
  };

  const toggleMedication = async (medication) => {
    try {
      await Medication.update(medication.id, { 
        ...medication, 
        isActive: !medication.isActive 
      });
      await loadData();
      scheduleGenerateTodayTasks(); // Debounced task generation
    } catch (error) {
      console.error("Error updating medication:", error);
    }
  };

  const getRefillAlerts = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return medications.filter(med => 
      med.isActive && 
      med.refillByDate && 
      isBefore(new Date(med.refillByDate), nextWeek)
    );
  };

  const refillAlerts = getRefillAlerts();

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
            <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
            <p className="text-gray-600 mt-1">Manage your pets' medication schedules</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm(); // Reset form and editingMed when dialog closes
            setShowAddDialog(isOpen);
          }}>
            <DialogTrigger asChild>
              <Button 
                disabled={pets.length === 0}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMed ? 'Edit Medication' : 'Add New Medication'}</DialogTitle>
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
                    <Label htmlFor="name">Medication Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Rimadyl, Heartgard"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dose">Dose *</Label>
                    <Input
                      id="dose"
                      value={formData.dose}
                      onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                      placeholder="e.g., 25, 1/2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg">mg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="tablets">tablets</SelectItem>
                        <SelectItem value="drops">drops</SelectItem>
                        <SelectItem value="other">other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="route">Route *</Label>
                    <Select
                      value={formData.route}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, route: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="topical">Topical</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once_daily">Once daily</SelectItem>
                      <SelectItem value="twice_daily">Twice daily</SelectItem>
                      <SelectItem value="three_times_daily">Three times daily</SelectItem>
                      <SelectItem value="as_needed">As needed</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date (optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="refillByDate">Refill By (optional)</Label>
                    <Input
                      id="refillByDate"
                      type="date"
                      value={formData.refillByDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, refillByDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions, side effects to watch for..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
                    {editingMed ? 'Save Changes' : 'Add Medication'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Refill Alerts */}
        {refillAlerts.length > 0 && (
          <div className="space-y-2">
            {refillAlerts.map((med) => {
              const pet = pets.find(p => p.id === med.petId);
              return (
                <Alert key={med.id} className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <strong>{med.name}</strong> for {pet?.name} needs refill by{' '}
                    {format(new Date(med.refillByDate), 'MMM d, yyyy')}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {pets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600 mb-4">Add a pet first to track medications</p>
              <Button variant="outline">
                Go to Pets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search medications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="all">All Medications</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Medications List */}
            {filteredMedications.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No medications found' : 'No medications recorded'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Start tracking your pets\' medications'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Medication
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMedications.map((medication) => {
                  const pet = pets.find(p => p.id === medication.petId);
                  const isExpired = medication.endDate && isAfter(new Date(), new Date(medication.endDate));
                  const needsRefill = medication.refillByDate && isBefore(new Date(medication.refillByDate), addDays(new Date(), 7));
                  
                  return (
                    // Added 'group' class for hover effect on action buttons
                    <Card key={medication.id} className={`hover:shadow-md transition-shadow group ${!medication.isActive ? 'opacity-60' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {pet?.photoUrl ? (
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={pet.photoUrl} />
                                <AvatarFallback>{pet.name[0]}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full flex items-center justify-center">
                                <Pill className="w-6 h-6 text-purple-700" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">{medication.name}</CardTitle>
                              <p className="text-sm text-gray-600">For {pet?.name || 'Unknown Pet'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Taken Today Toggle */}
                            {medication.isActive && (
                              <MedTakenToggle 
                                medication={medication} 
                                petId={medication.petId}
                              />
                            )}
                            
                            {/* Edit and Delete buttons */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(medication)} aria-label={`Edit ${medication.name}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(medication.id)} aria-label={`Delete ${medication.name}`}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <Switch
                              checked={medication.isActive}
                              onCheckedChange={() => toggleMedication(medication)}
                              aria-label={`Toggle ${medication.name} active status`}
                            />
                            <span className="text-sm text-gray-600">
                              {medication.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Dose:</span>
                            <p className="font-medium">{medication.dose} {medication.unit}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Route:</span>
                            <p className="font-medium capitalize">{medication.route}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Frequency:</span>
                            <p className="font-medium">{medication.frequency.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Started:</span>
                            <p className="font-medium">{format(new Date(medication.startDate), 'MMM d, yyyy')}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {medication.isActive && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="destructive">
                              Expired
                            </Badge>
                          )}
                          {needsRefill && (
                            <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Refill Soon
                            </Badge>
                          )}
                          {medication.endDate && !isExpired && (
                            <Badge variant="outline">
                              <Calendar className="w-3 h-3 mr-1" />
                              Until {format(new Date(medication.endDate), 'MMM d')}
                            </Badge>
                          )}
                        </div>

                        {medication.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {medication.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Build timestamp footer */}
      <footer className="text-center py-4 text-xs text-gray-500 border-t border-gray-200 mt-12">
        Build: {new Date().toLocaleString()}
      </footer>
    </div>
  );
}
