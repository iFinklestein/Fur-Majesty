
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Pet } from "@/api/entities";
import { VetVisit } from "@/api/entities";
import { Medication } from "@/api/entities";
import { Grooming } from "@/api/entities";
import { Task } from "@/api/entities";
import { VaccineRecord } from "@/api/entities";
import { PetNote } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { format, differenceInYears } from "date-fns";
import {
  Heart,
  Cake,
  Stethoscope,
  Pill,
  Scissors,
  ArrowLeft,
  Edit,
  Download,
  FileText,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import { exportPetReportAsPDF } from "../components/utils/exportData";
import VaccineRecords from "../components/vaccines/VaccineRecords";
import TaskWidget from "../components/tasks/TaskWidget";
import PetNotes from "../components/pets/PetNotes";
import DeletePetDialog from "../components/pets/DeletePetDialog";

export default function PetDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [vetVisits, setVetVisits] = useState([]);
  const [medications, setMedications] = useState([]);
  const [grooming, setGrooming] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // New state for delete dialog

  const getPetId = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get("petId");
  }, [location.search]);

  const loadData = useCallback(async (petId) => {
    setLoading(true);
    try {
      const [
        petData, 
        vetData, 
        medData, 
        groomingData, 
        taskData,
        vaccineData,
        noteData
      ] = await Promise.all([
        Pet.get(petId),
        VetVisit.filter({ petId }, '-date', 5),
        Medication.filter({ petId, isActive: true }, '-startDate', 5),
        Grooming.filter({ petId }, '-date', 5),
        Task.filter({ petId }, '-dueAt'),
        VaccineRecord.filter({ petId }, '-dateGiven'),
        PetNote.filter({ petId }, '-created_date'),
      ]);
      setPet(petData);
      setVetVisits(vetData);
      setMedications(medData);
      setGrooming(groomingData);
      setTasks(taskData);
      setVaccines(vaccineData);
      setNotes(noteData);
    } catch (error) {
      console.error("Error loading pet details:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const petId = getPetId();
    if (petId) {
      loadData(petId);
    }
  }, [getPetId, loadData]);
  
  const handleExportReport = async () => {
    if (!pet) return;
    setExporting(true);
    try {
      const result = await exportPetReportAsPDF(pet.id);
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert("❌ Failed to generate report.");
    } finally {
      setExporting(false);
    }
  };

  const handlePhotoUpdate = async (newPhotoUrl) => {
    try {
      if (!pet) return;
      const updatedPet = await Pet.update(pet.id, { photoUrl: newPhotoUrl });
      setPet(updatedPet);
    } catch (error) {
      console.error("Error updating pet photo:", error);
      alert("Failed to update pet photo.");
    }
  };

  const handlePhotoRemove = async () => {
    try {
      if (!pet) return;
      const updatedPet = await Pet.update(pet.id, { photoUrl: null });
      setPet(updatedPet);
    } catch (error) {
      console.error("Error removing pet photo:", error);
      alert("Failed to remove pet photo.");
    }
  };

  const handleRecordUpdate = () => {
    const petId = getPetId();
    if (petId) {
      loadData(petId);
    }
  };

  const handlePetDeleted = () => {
    // Navigate back to pets list and trigger a refresh
    navigate(createPageUrl("Pets"));
    // Trigger a page refresh to update dashboard counts
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl">Pet not found.</h2>
        <Link to={createPageUrl("Pets")}>
          <Button variant="link">Go back to My Pets</Button>
        </Link>
      </div>
    );
  }

  const age = pet.dob ? `${differenceInYears(new Date(), new Date(pet.dob))} years old` : "Unknown age";

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link to={createPageUrl("Pets")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to My Pets
          </Link>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportReport} disabled={exporting} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Generating...' : 'Export Report'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Pet Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault(); // Prevent dropdown from closing immediately
                    setIsDeleteOpen(true); // Open the dialog
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Pet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Pet Info */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-white shadow-md">
                      <AvatarImage src={pet.photoUrl} alt={pet.name} />
                      <AvatarFallback className="bg-orange-200 text-orange-700 text-3xl">
                        {pet.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Photo Update Controls */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                const { file_url } = await UploadFile({ file });
                                await handlePhotoUpdate(file_url);
                              } catch (error) {
                                console.error("Error uploading photo:", error);
                                alert("Failed to upload photo.");
                              }
                            }
                          }}
                          className="hidden"
                          id="pet-photo-update"
                        />
                        <label
                          htmlFor="pet-photo-update"
                          className="p-2 bg-white bg-opacity-80 rounded-full cursor-pointer hover:bg-opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </label>
                        {pet.photoUrl && (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to remove the pet's photo?")) {
                                handlePhotoRemove();
                              }
                            }}
                            className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold">{pet.name}</h1>
                  <p className="text-gray-600 capitalize">{pet.breed || pet.species}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-gray-500" />
                  <span className="capitalize">{pet.sex}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Cake className="w-4 h-4 text-gray-500" />
                  <span>{age} ({format(new Date(pet.dob), 'MMM d, yyyy')})</span>
                </div>
                {pet.notes && (
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                    <p className="text-gray-700">{pet.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tabbed Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                      Recent Vet Visits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vetVisits.length > 0 ? (
                      <ul className="space-y-3">
                        {vetVisits.map(visit => (
                          <li key={visit.id} className="text-sm">
                            <p className="font-medium">{visit.reason}</p>
                            <p className="text-gray-600">{visit.clinicName} - {format(new Date(visit.date), 'MMM d, yyyy')}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No recent vet visits recorded.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-purple-500" />
                      Active Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {medications.length > 0 ? (
                      <ul className="space-y-3">
                        {medications.map(med => (
                          <li key={med.id} className="text-sm">
                            <p className="font-medium">{med.name} ({med.dose} {med.unit})</p>
                            <p className="text-gray-600 capitalize">{med.frequency.replace(/_/g, ' ')}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No active medications.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-pink-500" />
                      Recent Grooming
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {grooming.length > 0 ? (
                      <ul className="space-y-3">
                        {grooming.map(g => (
                          <li key={g.id} className="text-sm">
                            <p className="font-medium capitalize">{g.type.replace(/_/g, ' ')}</p>
                            <p className="text-gray-600">{format(new Date(g.date), 'MMM d, yyyy')}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No recent grooming sessions.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vaccines">
                <VaccineRecords 
                  petId={pet.id} 
                  vaccines={vaccines}
                  onUpdate={handleRecordUpdate}
                />
              </TabsContent>

              <TabsContent value="tasks">
                <Card>
                  <CardHeader><CardTitle>Tasks for {pet.name}</CardTitle></CardHeader>
                  <CardContent>
                    <TaskWidget 
                      variant="full" 
                      tasks={tasks} 
                      pets={[pet]} 
                      onTaskUpdate={handleRecordUpdate}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <PetNotes 
                  petId={pet.id}
                  notes={notes}
                  onUpdate={handleRecordUpdate}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <DeletePetDialog
        pet={pet}
        open={isDeleteOpen} // Pass the state to control visibility
        onClose={() => setIsDeleteOpen(false)} // Pass a function to close the dialog
        onDeleted={handlePetDeleted}
      />
    </div>
  );
}
