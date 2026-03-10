const mongoose = require("mongoose");

const config = require("../config");
const UserModel = require("../models/user");
const AppointmentModel = require("../models/appointment");
const DoctorAvailabilityModel = require("../models/doctorAvailability");
const MedicalRecordModel = require("../models/medicalRecord");
const PrescriptionModel = require("../models/prescription");

const shouldReset = process.argv.includes("--reset");

function makeDate(dayOffset, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function pickFrom(list, index) {
  return list[index % list.length];
}

async function createUser(userData) {
  const user = new UserModel(userData);
  user.savePassword(userData.password);
  await user.save();

  if (user.role === "doctor" && user.shift) {
    const DoctorAvailabilityService = require("../services/doctorAvailabilityService");
    await DoctorAvailabilityService.createDefaultAvailability(user._id, user.shift);
  }

  return user;
}

async function clearDatabase() {
  await PrescriptionModel.deleteMany({});
  await MedicalRecordModel.deleteMany({});
  await AppointmentModel.deleteMany({});
  await DoctorAvailabilityModel.deleteMany({});
  await UserModel.deleteMany({});
}

async function seed() {
  await mongoose.connect(config.MongoConnection);
  console.log("Povezan sa MongoDB:", config.MongoConnection);

  if (shouldReset) {
    console.log("Ukljucen je RESET mode. Brisanje baze u toku...");
    await clearDatabase();
  }

  const existingUsers = await UserModel.countDocuments();
  if (existingUsers > 0 && !shouldReset) {
    console.log(
      "Baza nije prazna. Pokrenuti 'npm run seed:reset' za njeno brisanje."
    );
    return;
  }

  const usersData = [
    {
      JMBG: "1001001001001",
      firstName: "Admin",
      lastName: "Medify",
      password: "Admin123!",
      homeAddress: "Kralja Petra 1, Beograd",
      phoneNumber: "0601001001",
      gender: "male",
      role: "admin",
      dateOfBirth: new Date("1985-02-10")
    },
    {
      JMBG: "3003003003003",
      firstName: "Milan",
      lastName: "Jovanovic",
      password: "Doctor123!",
      homeAddress: "Cara Dusana 12, Kragujevac",
      phoneNumber: "0603003003",
      gender: "male",
      role: "doctor",
      dateOfBirth: new Date("1980-09-22"),
      specialization: "Kardiolog",
      licenseNumber: "LIC-DR-1001",
      yearsOfExperience: 15,
      officeNumber: "A-12",
      shift: "morning"
    },
    {
      JMBG: "4004004004004",
      firstName: "Jelena",
      lastName: "Petrovic",
      password: "Doctor123!",
      homeAddress: "Nemanjina 8, Nis",
      phoneNumber: "0604004004",
      gender: "female",
      role: "doctor",
      dateOfBirth: new Date("1987-03-14"),
      specialization: "Dermatolog",
      licenseNumber: "LIC-DR-1002",
      yearsOfExperience: 10,
      officeNumber: "B-07",
      shift: "evening"
    },
    {
      JMBG: "5005005005005",
      firstName: "Marko",
      lastName: "Nikolic",
      password: "Patient123!",
      homeAddress: "Vojvode Stepe 100, Beograd",
      phoneNumber: "0605005005",
      gender: "male",
      role: "patient",
      dateOfBirth: new Date("1996-07-03"),
      bloodType: "A+",
      allergies: ["penicillin"],
      insuranceNumber: "INS-5001",
      insuranceCompany: "Dunav"
    },
    {
      JMBG: "6006006006006",
      firstName: "Ana",
      lastName: "Markovic",
      password: "Patient123!",
      homeAddress: "Bulevar Nemanjica 22, Nis",
      phoneNumber: "0606006006",
      gender: "female",
      role: "patient",
      dateOfBirth: new Date("1999-11-18"),
      bloodType: "O-",
      allergies: ["pollen"],
      insuranceNumber: "INS-6001",
      insuranceCompany: "Generali"
    }
  ];

  const createdUsers = [];
  for (const userData of usersData) {
    const user = await createUser(userData);
    createdUsers.push(user);
  }

  const doctors = createdUsers.filter((u) => u.role === "doctor");
  const patients = createdUsers.filter((u) => u.role === "patient");

  const appointmentReasons = [
    "Kontrola krvnog pritiska",
    "Preventivni pregled",
    "Bol u grudima",
    "Alergijska reakcija",
    "Pregled koze",
    "Vrtoglavica",
    "Nesanica",
    "Konsultacija terapije",
    "Kontrola laboratorije",
    "Glavobolja"
  ];

  const diagnosisData = [
    {
      diagnosis: "Blaga hipertenzija",
      treatment: "ACE inhibitor i redovna kontrola pritiska.",
      recommendations: "Smanjiti unos soli i povecati fizicku aktivnost.",
      medications: [
        {
          name: "Ramipril",
          dosage: "5mg",
          frequency: "1x dnevno",
          duration: "30 dana",
          instructions: "Ujutru pre dorucka"
        }
      ]
    },
    {
      diagnosis: "Akutni dermatitis",
      treatment: "Lokalna kortikosteroidna terapija 7 dana.",
      recommendations: "Izbegavati nadrazujuce preparate za kozu.",
      medications: [
        {
          name: "Hidrokortizon krema",
          dosage: "1%",
          frequency: "2x dnevno",
          duration: "7 dana",
          instructions: "Naneti tanak sloj na zahvaceno mesto"
        }
      ]
    },
    {
      diagnosis: "Anksioznost blagog stepena",
      treatment: "Higijensko-dijetetski rezim i pracenje simptoma.",
      recommendations: "Tehnike disanja i redovan san.",
      medications: [
        {
          name: "Magnezijum",
          dosage: "375mg",
          frequency: "1x dnevno",
          duration: "30 dana",
          instructions: "Posle obroka"
        }
      ]
    },
    {
      diagnosis: "Dislipidemija",
      treatment: "Uvesti terapiju statinom i dijetalni rezim.",
      recommendations: "Smanjiti unos zasicenih masti.",
      medications: [
        {
          name: "Atorvastatin",
          dosage: "20mg",
          frequency: "1x dnevno",
          duration: "60 dana",
          instructions: "Uvece pre spavanja"
        }
      ]
    },
    {
      diagnosis: "Sezonski alergijski rinitis",
      treatment: "Antihistaminska terapija u sezoni simptoma.",
      recommendations: "Izbegavati izlaganje alergenima.",
      medications: [
        {
          name: "Loratadin",
          dosage: "10mg",
          frequency: "1x dnevno",
          duration: "14 dana",
          instructions: "Po mogucnosti u isto vreme svaki dan"
        }
      ]
    }
  ];

  const symptomsPool = [
    "umor",
    "glavobolja",
    "svrab",
    "osip",
    "lupanje srca",
    "vrtoglavica",
    "nervoza",
    "kijanje",
    "zapusen nos",
    "blagi bol u grudima"
  ];

  const appointments = [];

  // Istorijski termini (vecina completed) iz kojih pravimo kartone i recepte.
  const historicalAppointments = 48;
  const medicalRecords = [];
  for (let i = 0; i < historicalAppointments; i++) {
    const doctor = pickFrom(doctors, i);
    const patient = pickFrom(patients, i + 1);
    const dayOffset = -120 + i * 2;
    const hour = doctor.shift === "evening" ? 16 + (i % 6) : 8 + (i % 8);
    const minute = i % 2 === 0 ? 0 : 30;

    const appointment = await AppointmentModel.makeAppointment(
      doctor,
      patient,
      makeDate(dayOffset, hour, minute),
      pickFrom(appointmentReasons, i)
    );

    if (i % 10 === 0) {
      appointment.status = "canceled";
    } else {
      appointment.status = "completed";
    }

    await appointment.save();
    appointments.push(appointment);

    if (appointment.status !== "completed") {
      continue;
    }

    const diagnosisItem = pickFrom(diagnosisData, i);
    const symptomA = pickFrom(symptomsPool, i);
    const symptomB = pickFrom(symptomsPool, i + 3);

    const record = await MedicalRecordModel.create({
      patient: patient._id,
      doctor: doctor._id,
      appointment: appointment._id,
      visitDate: makeDate(dayOffset, hour, minute + 20),
      diagnosis: diagnosisItem.diagnosis,
      symptoms: [symptomA, symptomB],
      examinationNotes: "Pacijent urednog opsteg stanja, savetovana kontrola po planu.",
      treatment: diagnosisItem.treatment,
      recommendations: diagnosisItem.recommendations,
      vitalSigns: {
        bloodPressure: `${118 + (i % 18)}/${74 + (i % 14)}`,
        heartRate: 68 + (i % 20),
        temperature: 36.3 + ((i % 7) * 0.1),
        weight: 60 + (i % 35),
        height: 160 + (i % 25)
      },
      followUpDate: makeDate(dayOffset + 30, hour, minute)
    });

    medicalRecords.push(record);

    const prescriptionCountForRecord = i % 3 === 0 ? 2 : 1;
    for (let j = 0; j < prescriptionCountForRecord; j++) {
      const prescriptionStatus = dayOffset < -20 ? "completed" : "active";
      const baseMedication = diagnosisItem.medications[0];

      await PrescriptionModel.create({
        patient: patient._id,
        doctor: doctor._id,
        medicalRecord: record._id,
        appointment: appointment._id,
        medications: [
          baseMedication,
          ...(j === 1
            ? [
                {
                  name: "Vitamin D",
                  dosage: "2000 IU",
                  frequency: "1x dnevno",
                  duration: "30 dana",
                  instructions: "Uz obrok"
                }
              ]
            : [])
        ],
        issueDate: makeDate(dayOffset, hour + 1, minute),
        validUntil: makeDate(dayOffset + 30, 23, 59),
        status: prescriptionStatus,
        notes: j === 1 ? "Dodata suportivna terapija." : "Standardna terapija."
      });
    }
  }

  // Buduci termini za prikaz u dashboard-u i testiranje zakazivanja.
  const futureAppointments = 24;
  for (let i = 0; i < futureAppointments; i++) {
    const doctor = pickFrom(doctors, i + 2);
    const patient = pickFrom(patients, i);
    const dayOffset = 1 + i;
    const hour = doctor.shift === "evening" ? 16 + (i % 6) : 9 + (i % 7);
    const minute = i % 2 === 0 ? 0 : 30;

    const appointment = await AppointmentModel.makeAppointment(
      doctor,
      patient,
      makeDate(dayOffset, hour, minute),
      pickFrom(appointmentReasons, i + 5)
    );

    appointment.status = i % 8 === 0 ? "canceled" : "scheduled";
    await appointment.save();
    appointments.push(appointment);
  }

  const result = {
    users: await UserModel.countDocuments(),
    availability: await DoctorAvailabilityModel.countDocuments(),
    appointments: await AppointmentModel.countDocuments(),
    medicalRecords: await MedicalRecordModel.countDocuments(),
    prescriptions: await PrescriptionModel.countDocuments()
  };

  console.log("Seed zavrsen.");
  console.table(result);
  console.log("Test kredencijali:");
  console.log("admin:   JMBG 1001001001001 / password Admin123!");
  console.log("doctor:  JMBG 3003003003003 / password Doctor123!");
  console.log("patient: JMBG 5005005005005 / password Patient123!");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log("MongoDB konekcija zatvorena.");
  });
