import { Pet } from "@/api/entities";
import { VetVisit } from "@/api/entities";
import { Medication } from "@/api/entities";
import { Grooming } from "@/api/entities";
import { Feeding } from "@/api/entities/Feeding";
import { addDays, format } from "date-fns";

export const seedDemoData = async () => {
  try {
    console.log("🌱 Seeding demo data...");

    // Create 2 demo pets
    const pet1 = await Pet.create({
      name: "Queenie",
      species: "dog", 
      breed: "Golden Retriever",
      sex: "female",
      dob: "2020-03-15",
      notes: "Loves treats and belly rubs. Very friendly with other dogs.",
      archived: false
    });

    const pet2 = await Pet.create({
      name: "Oliver",
      species: "cat",
      breed: "Maine Coon", 
      sex: "male",
      dob: "2019-07-22",
      notes: "Indoor cat who loves sunny windowsills. Prefers wet food.",
      archived: false
    });

    console.log("✅ Created demo pets");

    // Create vet visits (including one with follow-up tomorrow)
    await VetVisit.create({
      petId: pet1.id,
      date: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
      clinicName: "Happy Paws Veterinary Clinic",
      reason: "Annual checkup and vaccinations",
      notes: "All vaccinations up to date. Recommended dental cleaning next year.",
      cost: 125.50
    });

    await VetVisit.create({
      petId: pet1.id, 
      date: format(addDays(new Date(), -7), 'yyyy-MM-dd'),
      clinicName: "Happy Paws Veterinary Clinic",
      reason: "Minor ear infection",
      notes: "Prescribed ear drops. Follow-up in 2 weeks to check healing.",
      followUpDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), // Tomorrow
      cost: 85.00
    });

    await VetVisit.create({
      petId: pet2.id,
      date: format(addDays(new Date(), -45), 'yyyy-MM-dd'),
      clinicName: "Feline Friends Clinic", 
      reason: "Routine wellness exam",
      notes: "Healthy weight. Discussed indoor enrichment activities.",
      cost: 95.00
    });

    console.log("✅ Created demo vet visits");

    // Create medications (including one due today)
    await Medication.create({
      petId: pet1.id,
      name: "Ear Drops",
      dose: "3",
      unit: "drops",
      route: "topical",
      frequency: "twice_daily",
      startDate: format(addDays(new Date(), -7), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      notes: "Apply to affected ear. Complete full course even if symptoms improve.",
      isActive: true
    });

    await Medication.create({
      petId: pet2.id,
      name: "Hairball Prevention",
      dose: "1", 
      unit: "tablets",
      route: "oral",
      frequency: "once_daily",
      startDate: format(new Date(), 'yyyy-MM-dd'),
      refillByDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'),
      notes: "Give with food to prevent stomach upset.",
      isActive: true
    });

    console.log("✅ Created demo medications");

    // Create grooming logs
    await Grooming.create({
      petId: pet1.id,
      type: "full_groom",
      date: format(addDays(new Date(), -14), 'yyyy-MM-dd'),
      groomerName: "Pampered Paws Salon",
      cost: 75.00,
      nextDate: format(addDays(new Date(), 28), 'yyyy-MM-dd'),
      notes: "Full groom including nail trim and ear cleaning. Queenie was very well-behaved!"
    });

    await Grooming.create({
      petId: pet2.id,
      type: "nail_trim",
      date: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
      groomerName: "At-home grooming",
      cost: 0,
      notes: "Trimmed front claws. Still need to work on back paws - Oliver was not cooperative."
    });

    console.log("✅ Created demo grooming logs");

    // Create feeding schedules (AM/PM)
    await Feeding.create({
      petId: pet1.id,
      times: ["07:30", "18:00"], 
      foodBrand: "Blue Buffalo Life Protection",
      foodType: "dry",
      amount: "1.5",
      unit: "cups",
      notes: "Split into two meals. Sometimes add a small amount of wet food as topper.",
      isActive: true
    });

    await Feeding.create({
      petId: pet2.id,
      times: ["08:00", "17:30"],
      foodBrand: "Hill's Science Diet", 
      foodType: "wet",
      amount: "1",
      unit: "cans",
      notes: "Indoor cat formula. Prefers pate texture over chunks.",
      isActive: true
    });

    console.log("✅ Created demo feeding schedules");
    console.log("🎉 Demo data seeding complete!");

    return {
      pets: [pet1, pet2],
      message: "Demo data created successfully! You now have 2 pets with sample vet visits, medications, grooming logs, and feeding schedules."
    };

  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
};