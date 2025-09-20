
import React, { useState, useEffect } from "react";
import { Grooming } from "@/api/entities";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import { format, addDays } from "date-fns";
import {
  Scissors,
  Plus,
  Search,
  Calendar,
  Droplets,
  Heart,
  Ear,
  Eye,
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

const GROOMING_TYPES = [
  { value: 'full_groom', label: 'Full Groom', icon: Scissors, color: 'bg-purple-100 text-purple-700' },
  { value: 'bath_only', label: 'Bath Only', icon: Droplets, color: 'bg-blue-100 text-blue-700' },
  { value: 'nail_trim', label: 'Nail Trim', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  { value: 'teeth_cleaning', label: 'Teeth Cleaning', icon: Heart, color: 'bg-green-100 text-green-700' },
  { value: 'ear_cleaning', label: 'Ear Cleaning', icon: Ear, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'flea_treatment', label: 'Flea Treatment', icon: Eye, color: 'bg-red-100 text-red-700' },
  { value: 'other', label: 'Other', icon: Scissors, color: 'bg-gray-100 text-gray-700' }
];

export default function GroomingPage() {
  const [groomingSessions, setGroomingSessions] = useState([]);
  const [pets, setPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    petId: "",
    type: "",
    date: new Date().toISOString().split('T')[0],
    nextDate: "",
    groomerName: "",
    cost: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const [groomingData, petData] = await Promise.all([
        Grooming.filter({ created_by: user.email }, '-date'),
        Pet.filter({ created_by: user.email, archived: false }, '-created_date')
      ]);
      setGroomingSessions(groomingData);
      setPets(petData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = groomingSessions.filter(session => {
    const pet = pets.find(p => p.id === session.petId);
    return (
      (session.groomerName && session.groomerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet && pet.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined
      };
      if (editingSession) {
        await Grooming.update(editingSession.id, submitData);
      } else {
        await Grooming.create(submitData);
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error("Error saving grooming session:", error);
    }
  };
  
  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      ...session,
      date: session.date ? format(new Date(session.date), 'yyyy-MM-dd') : "",
      nextDate: session.nextDate ? format(new Date(session.nextDate), 'yyyy-MM-dd') : ""
    });
    setShowAddDialog(true);
  };
  
  const handleDelete = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this grooming session?")) {
      try {
        await Grooming.delete(sessionId);
        await loadData();
      } catch (error) {
        console.error("Error deleting grooming session:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      petId: "",
      type: "",
      date: new Date().toISOString().split('T')[0],
      nextDate: "",
      groomerName: "",
      cost: "",
      notes: ""
    });
    setEditingSession(null);
    setShowAddDialog(false);
  };

  const handleQuickAdd = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      nextDate: addDays(new Date(), getDefaultInterval(type)).toISOString().split('T')[0]
    }));
    setShowAddDialog(true);
  };

  const getDefaultInterval = (type) => {
    switch (type) {
      case 'full_groom': return 42; // 6 weeks
      case 'bath_only': return 14; // 2 weeks
      case 'nail_trim': return 21; // 3 weeks
      case 'teeth_cleaning': return 90; // 3 months
      case 'ear_cleaning': return 30; // 1 month
      case 'flea_treatment': return 30; // 1 month
      default: return 30;
    }
  };

  const getTypeConfig = (type) => {
    return GROOMING_TYPES.find(t => t.value === type) || GROOMING_TYPES[0];
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Grooming</h1>
            <p className="text-gray-600 mt-1">Track your pets' grooming sessions</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm(); // Reset form when dialog closes
            setShowAddDialog(isOpen);
          }}>
            <DialogTrigger asChild>
              <Button 
                disabled={pets.length === 0}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Grooming
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSession ? 'Edit Grooming Session' : 'Add Grooming Session'}</DialogTitle>
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
                    <Label htmlFor="type">Grooming Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {GROOMING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nextDate">Next Grooming Date (optional)</Label>
                    <Input
                      id="nextDate"
                      type="date"
                      value={formData.nextDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="groomerName">Groomer/Salon</Label>
                    <Input
                      id="groomerName"
                      value={formData.groomerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, groomerName: e.target.value }))}
                      placeholder="Groomer or salon name"
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special notes about this grooming session..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">
                    {editingSession ? 'Save Changes' : 'Add Session'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {pets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600 mb-4">Add a pet first to track grooming sessions</p>
              <Button variant="outline">
                Go to Pets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Add Grooming</CardTitle>
                <p className="text-sm text-gray-600">Choose a grooming type to quickly log a session</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {GROOMING_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        className={`h-16 flex flex-col gap-1 ${type.color} border-transparent hover:shadow-md`}
                        onClick={() => handleQuickAdd(type.value)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search grooming sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Grooming Sessions */}
            {filteredSessions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No sessions found' : 'No grooming sessions recorded'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Start tracking your pets\' grooming'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Session
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  const pet = pets.find(p => p.id === session.petId);
                  const typeConfig = getTypeConfig(session.type);
                  const Icon = typeConfig.icon;
                  
                  return (
                    <Card key={session.id} className="hover:shadow-md transition-shadow group">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {pet?.photoUrl ? (
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={pet.photoUrl} />
                                <AvatarFallback>{pet.name[0]}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
                                <Icon className="w-6 h-6 text-pink-700" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">{pet?.name || 'Unknown Pet'}</CardTitle>
                              <p className="text-sm text-gray-600 capitalize">
                                {typeConfig.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(session)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(session.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <Badge variant="outline" className="mb-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(session.date), 'MMM d, yyyy')}
                            </Badge>
                            {session.cost && (
                              <p className="text-sm font-medium text-green-600">
                                ${session.cost.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {session.groomerName && (
                          <p className="text-sm text-gray-600">
                            <strong>Groomer:</strong> {session.groomerName}
                          </p>
                        )}
                        
                        {session.notes && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {session.notes}
                          </p>
                        )}

                        {session.nextDate && (
                          <Badge variant="secondary" className="w-fit">
                            Next Reminder: {format(new Date(session.nextDate), 'MMM d, yyyy')}
                          </Badge>
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
    </div>
  );
}
