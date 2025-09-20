
import { Pet } from "@/api/entities";
import { VetVisit } from "@/api/entities";
import { Medication } from "@/api/entities";
import { Grooming } from "@/api/entities";
import { FeedingSchedule } from "@/api/entities"; // Changed from Feeding
import { User } from "@/api/entities";
import { format } from "date-fns";

export const exportAllDataAsCSV = async () => {
  try {
    const user = await User.me();
    
    // Load all data
    const [pets, vetVisits, medications, grooming, feedingSchedules] = await Promise.all([ // Changed 'feeding' to 'feedingSchedules'
      Pet.filter({ created_by: user.email }),
      VetVisit.filter({ created_by: user.email }),
      Medication.filter({ created_by: user.email }),
      Grooming.filter({ created_by: user.email }),
      FeedingSchedule.filter({ created_by: user.email }) // Changed Feeding.filter to FeedingSchedule.filter
    ]);

    // Helper function to convert array of objects to CSV
    const arrayToCSV = (data, filename) => {
      if (data.length === 0) return { filename, content: "No data available" };
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => 
        Object.values(obj).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      
      return {
        filename,
        content: [headers, ...rows].join('\n')
      };
    };

    // Create CSV files for each entity
    const csvFiles = [
      arrayToCSV(pets, 'pets.csv'),
      arrayToCSV(vetVisits, 'vet_visits.csv'),
      arrayToCSV(medications, 'medications.csv'), 
      arrayToCSV(grooming, 'grooming.csv'),
      arrayToCSV(feedingSchedules, 'feeding_schedules.csv') // Changed 'feeding' to 'feedingSchedules'
    ];

    // Create and download ZIP file (simulated)
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const zipFilename = `pet_log_export_${timestamp}.zip`;

    // For now, we'll create individual CSV downloads
    // In a real app, you'd use a library like JSZip to create actual ZIP files
    csvFiles.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timestamp}_${file.filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    return {
      success: true,
      message: `Exported ${csvFiles.length} CSV files`,
      files: csvFiles.map(f => f.filename)
    };

  } catch (error) {
    console.error("Error exporting data:", error);
    return {
      success: false,
      message: "Failed to export data",
      error: error.message
    };
  }
};

export const exportPetReportAsPDF = async (petId) => {
  // This would normally generate a PDF report
  // For now, we'll create a comprehensive text report
  try {
    const user = await User.me();
    const pet = await Pet.get(petId);
    
    const [vetVisits, medications, grooming] = await Promise.all([
      VetVisit.filter({ petId, created_by: user.email }, '-date'),
      Medication.filter({ petId, created_by: user.email }),
      Grooming.filter({ petId, created_by: user.email }, '-date')
    ]);

    // Create comprehensive report
    const reportContent = `
PET HEALTH REPORT
=================

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Not specified'}
- Sex: ${pet.sex || 'Not specified'}
- Date of Birth: ${pet.dob ? format(new Date(pet.dob), 'MMMM d, yyyy') : 'Not specified'}
- Notes: ${pet.notes || 'No notes'}

Owner Information:
- Name: ${user.full_name || 'Not specified'}
- Email: ${user.email}
- Report Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}

VETERINARY VISITS (${vetVisits.length} total)
==================
${vetVisits.map(visit => `
Date: ${format(new Date(visit.date), 'MMMM d, yyyy')}
Clinic: ${visit.clinicName}
Reason: ${visit.reason}
Notes: ${visit.notes || 'No notes'}
Cost: ${visit.cost ? '$' + visit.cost.toFixed(2) : 'Not recorded'}
Follow-up: ${visit.followUpDate ? format(new Date(visit.followUpDate), 'MMMM d, yyyy') : 'None scheduled'}
---`).join('\n')}

ACTIVE MEDICATIONS (${medications.filter(m => m.isActive).length} active)
===================
${medications.filter(m => m.isActive).map(med => `
Name: ${med.name}
Dose: ${med.dose} ${med.unit}
Route: ${med.route}
Frequency: ${med.frequency.replace(/_/g, ' ')}
Start Date: ${format(new Date(med.startDate), 'MMMM d, yyyy')}
End Date: ${med.endDate ? format(new Date(med.endDate), 'MMMM d, yyyy') : 'Ongoing'}
Notes: ${med.notes || 'No notes'}
---`).join('\n')}

GROOMING HISTORY (${grooming.length} sessions)
================
${grooming.map(session => `
Date: ${format(new Date(session.date), 'MMMM d, yyyy')}
Type: ${session.type.replace(/_/g, ' ')}
Groomer: ${session.groomerName || 'Not specified'}
Cost: ${session.cost ? '$' + session.cost.toFixed(2) : 'Not recorded'}
Notes: ${session.notes || 'No notes'}
---`).join('\n')}

End of Report
=============
Generated by Pet Log (Queenie Edition)
    `.trim();

    // Download as text file (in a real app, this would be a PDF)
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pet.name}_health_report_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Health report for ${pet.name} downloaded successfully`
    };

  } catch (error) {
    console.error("Error generating pet report:", error);
    return {
      success: false,
      message: "Failed to generate pet report",
      error: error.message
    };
  }
};
