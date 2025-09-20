
import React, { useState, useEffect } from "react";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Heart,
  Plus,
  Search,
  Edit,
  Camera,
  Dog,
  Cat,
  Bird,
  Fish,
  Archive,
  ArchiveRestore,
  PawPrint
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import EmptyState from "../components/utils/QueenieEmptyState"; // Assuming this component is general enough or will be renamed to just EmptyState

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    sex: "",
    dob: "",
    photoUrl: "",
    notes: "",
    archived: false,
  });

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const user = await User.me();
      const petData = await Pet.filter({ created_by: user.email }, '-created_date');
      setPets(petData);
    } catch (error) {
      console.error("Error loading pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesArchived = showArchived ? true : !pet.archived;

    return matchesSearch && matchesArchived;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPet) {
        await Pet.update(editingPet.id, formData);
      } else {
        await Pet.create(formData);
      }
      await loadPets();
      resetForm();
    } catch (error) {
      console.error("Error saving pet:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      species: "",
      breed: "",
      sex: "",
      dob: "",
      photoUrl: "",
      notes: "",
      archived: false,
    });
    setEditingPet(null);
    setShowAddDialog(false);
  };

  const handleEdit = (pet) => {
    setFormData(pet);
    setEditingPet(pet);
    setShowAddDialog(true);
  };

  const handleArchiveToggle = async (pet) => {
    try {
      await Pet.update(pet.id, { ...pet, archived: !pet.archived });
      await loadPets();
    } catch (error) {
      console.error("Error archiving pet:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, photoUrl: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const getSpeciesIcon = (species) => {
    switch (species) {
      case 'dog': return Dog;
      case 'cat': return Cat;
      case 'bird': return Bird;
      case 'fish': return Fish;
      default: return Heart;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Removed queenieMode and theme object, using static orange/pink theme values

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
            <p className="text-gray-600 mt-1">Manage your beloved companions</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Pet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPet ? 'Edit Pet' : 'Add New Pet'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    {formData.photoUrl ? (
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={formData.photoUrl} />
                        <AvatarFallback>{formData.name[0] || 'P'}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter pet's name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="species">Species *</Label>
                  <Select
                    value={formData.species}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="hamster">Hamster</SelectItem>
                      <SelectItem value="guinea_pig">Guinea Pig</SelectItem>
                      <SelectItem value="reptile">Reptile</SelectItem>
                      <SelectItem value="fish">Fish</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="Enter breed (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="sex">Gender</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about your pet"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                    {editingPet ? 'Update Pet' : 'Add Pet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search pets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">Show Archived</Label>
          </div>
        </div>

        {/* Pet Grid */}
        {filteredPets.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              {/* Removed conditional QueenieEmptyState rendering */}
              <EmptyState
                icon={Heart}
                title={searchTerm ? 'No pets found' : 'No pets added yet'}
                message={searchTerm ? 'Try adjusting your search terms' : 'Add your first pet to get started'}
                actionButton={!searchTerm && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Pet
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => {
              const SpeciesIcon = getSpeciesIcon(pet.species);
              return (
                <Card key={pet.id} className={`hover:shadow-lg transition-shadow group ${pet.archived ? 'bg-gray-100 opacity-70' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {pet.photoUrl ? (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={pet.photoUrl} alt={pet.name} />
                            <AvatarFallback className="text-orange-700"> {/* Replaced theme.avatarText */}
                              {pet.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-200 to-pink-200 rounded-full flex items-center justify-center"> {/* Replaced theme.avatarBg */}
                            <SpeciesIcon className="w-6 h-6 text-orange-700" /> {/* Replaced theme.avatarText */}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{pet.name}</CardTitle>
                          <p className="text-sm text-gray-600 capitalize">
                            {pet.breed ? `${pet.breed}` : pet.species}
                          </p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveToggle(pet)}
                          title={pet.archived ? 'Restore' : 'Archive'}
                        >
                          {pet.archived ? <ArchiveRestore className="w-4 h-4 text-green-600" /> : <Archive className="w-4 h-4 text-red-600" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(pet)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {pet.sex || 'Unknown gender'}
                      </Badge>
                      {pet.dob && (
                        <Badge variant="outline">
                          Born {format(new Date(pet.dob), 'MMM yyyy')}
                        </Badge>
                      )}
                      {pet.archived && (
                        <Badge variant="destructive">Archived</Badge>
                      )}
                    </div>

                    {pet.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{pet.notes}</p>
                    )}

                    <div className="pt-3 border-t">
                      <Link to={createPageUrl(`PetDetail?petId=${pet.id}`)}>
                        <Button variant="outline" className="w-full" disabled={pet.archived}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
