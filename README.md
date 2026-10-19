# ResetaTime PH — Smart Prescription Schedule & Alert PWA

A 100% free, offline-first **React + TypeScript + Tailwind CSS Progressive Web App (PWA)** designed specifically for **Philippine prescriptions (*Reseta*)** and **FDA Philippines (FDA PH)** medicines.

## Key Features
1. **Routine-Anchored Schedule Translator**: Converts confusing clinical shorthand (`OD`, `BID`, `TID`, `QID`, `q8h`, `q12h`, `AC`, `PC`, `HS`, `PRN`) into exact daily clock times anchored to the user's real **Wake-Up, Almusal (Breakfast), Tanghalian (Lunch), Hapunan (Dinner), and Bedtime** hours.
2. **FDA PH Dual Search (Generic $\leftrightarrow$ Brand)**: Search offline by either the doctor's Generic name (*Paracetamol*, *Co-Amoxiclav*, *Carbocisteine*, *Losartan*) or the pharmacy Brand name (*Biogesic*, *Augmentin*, *Solmux*, *Lifezar*, *RiteMED*).
3. **Interactive Reseta Shorthand Decoder**: Type what is written on the paper (e.g., `"1 tab TID PC for 7 days #21"`) and watch it automatically select the dose, frequency, food rule, duration, and total quantity.
4. **Family & Caregiver Multi-Profile Mode**: Manage medications separately for multiple family members (*Ako*, *Nanay*, *Tatay*, *Lola/Lolo*, *Anak*) under one account with custom meal times, color badges, and an All-Family combined view.
5. **Segmented Time-of-Day Timeline Tabs**: Convenient tabs for Morning (*Umaga*), Afternoon (*Tanghali*), Evening (*Gabi*), Bedtime (*Tulog*), and All Day (*Lahat*) with progress counters.
6. **PH *"Tingi"* (Partial Purchase) Stock Tracker**: Compares `# Prescribed on Reseta` vs. `Bought Today` and warns before the patient runs out of tablets mid-course.
7. **Zero-Cloud Backup & Device Transfer**: 1-click JSON backup export and restore to migrate between phones or laptops without any server or account required.
8. **Multi-Layer Offline Alerts**:
   - Web Audio API gentle chime (works 100% offline with zero external audio files)
   - PWA Service Worker Notifications
   - 1-Tap `.ics` Phone Calendar / Native Alarm export with family member names

## Quick Start
```bash
npm install
npm run dev
```

## Importing Official FDA PH Drug Registry CSV
```bash
npm run import:fda path/to/fda-ph-drugs.csv
```
