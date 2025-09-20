import React, { useState, useEffect, useRef } from "react";
import { Pet } from "@/api/entities";
import { VetVisit } from "@/api/entities";
import { Medication } from "@/api/entities";
import { Grooming } from "@/api/entities";
import { FeedingSchedule } from "@/api/entities";
import { Task } from "@/api/entities";
import { VaccineRecord } from "@/api/entities";
import { PetNote } from "@/api/entities";
import { MedDoseLog } from "@/api/entities";
import { User } from "@/api/entities";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DeletePetDialog({ pet, open, onDeleted, onClose }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const matches = confirmText === pet?.name;

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setConfirmText("");
      setError("");
      setDeleting(false);
      // Focus the input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!matches) {
      setError("Pet name doesn't match. Please type the exact name.");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const user = await User.me();
      console.log(`Starting hard delete for pet ${pet.name} (${pet.id})`);
      
      const relatedDataFilters = { created_by: user.email, petId: pet.id };
      
      const taskToDelete = await Task.filter(relatedDataFilters);
      if (taskToDelete.length > 0) await Promise.all(taskToDelete.map(i => Task.delete(i.id)));
      console.log(`Deleted ${taskToDelete.length} tasks`);
      
      const notesToDelete = await PetNote.filter(relatedDataFilters);
      if (notesToDelete.length > 0) await Promise.all(notesToDelete.map(i => PetNote.delete(i.id)));
      console.log(`Deleted ${notesToDelete.length} notes`);
      
      const doseLogsToDelete = await MedDoseLog.filter(relatedDataFilters);
      if(doseLogsToDelete.length > 0) await Promise.all(doseLogsToDelete.map(i => MedDoseLog.delete(i.id)));
      console.log(`Deleted ${doseLogsToDelete.length} dose logs`);

      const medsToDelete = await Medication.filter(relatedDataFilters);
      if(medsToDelete.length > 0) await Promise.all(medsToDelete.map(i => Medication.delete(i.id)));
      console.log(`Deleted ${medsToDelete.length} medications`);
      
      const vaccinesToDelete = await VaccineRecord.filter(relatedDataFilters);
      if(vaccinesToDelete.length > 0) await Promise.all(vaccinesToDelete.map(i => VaccineRecord.delete(i.id)));
      console.log(`Deleted ${vaccinesToDelete.length} vaccine records`);

      const vetVisitsToDelete = await VetVisit.filter(relatedDataFilters);
      if(vetVisitsToDelete.length > 0) await Promise.all(vetVisitsToDelete.map(i => VetVisit.delete(i.id)));
      console.log(`Deleted ${vetVisitsToDelete.length} vet visits`);

      const groomingToDelete = await Grooming.filter(relatedDataFilters);
      if(groomingToDelete.length > 0) await Promise.all(groomingToDelete.map(i => Grooming.delete(i.id)));
      console.log(`Deleted ${groomingToDelete.length} grooming sessions`);

      const feedingsToDelete = await FeedingSchedule.filter(relatedDataFilters);
      if(feedingsToDelete.length > 0) await Promise.all(feedingsToDelete.map(i => FeedingSchedule.delete(i.id)));
      console.log(`Deleted ${feedingsToDelete.length} feeding schedules`);

      await Pet.delete(pet.id);
      console.log(`Deleted pet ${pet.name}`);

      alert(`✅ ${pet.name} deleted permanently.`);
      onClose(); // Close dialog
      onDeleted(); // Trigger navigation and refresh
      
    } catch (e) {
      console.error("Error deleting pet:", e);
      setError("Failed to delete pet and related data. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && matches && !deleting) {
      handleDelete();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (matches && !deleting) {
      handleDelete();
    }
  };

  if (!open) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Pet Permanently
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>This action cannot be undone.</strong><br />
              This will permanently delete <strong>{pet.name}</strong> and all related data including:
              medications, vet visits, grooming records, feeding schedules, vaccine records, notes, tasks, and photos.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="confirmText">
              Type <strong>{pet.name}</strong> to confirm:
            </Label>
            <Input
              ref={inputRef}
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Enter "${pet.name}" exactly`}
              className={error ? "border-red-500" : ""}
              autoComplete="off"
              aria-label="Type pet name to confirm"
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="destructive"
              disabled={!matches || deleting}
            >
              {deleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}