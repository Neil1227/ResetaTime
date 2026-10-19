import { test, expect } from '@playwright/test';

test.describe('ResetaTime PH - Core End-to-End Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local live app root URL (configured via baseURL in playwright.config.ts)
    await page.goto('/');
  });

  test('Scenario 1: App initializes with Branding, Default Profile, and Today Plan banner', async ({ page }) => {
    // 1. Verify app title and header branding
    await expect(page).toHaveTitle(/ResetaTime/i);
    await expect(page.getByRole('heading', { level: 1, name: /ResetaTime/i })).toBeVisible();

    // 2. Verify Today's Plan banner and Schedule tab are active
    await expect(page.getByText(/Schedule Ngayong Araw|Today's Plan/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Schedule/i })).toBeVisible();
  });

  test('Scenario 2: User Identity & Profile Management - Add and switch family member', async ({ page }) => {
    // 1. Open the Family Profiles Modal
    const memberButton = page.getByRole('button', { name: /Miyembro|Member/i });
    await expect(memberButton).toBeVisible();
    await memberButton.click();

    // 2. Assert Modal Dialog appears
    const profileDialog = page.getByRole('dialog', { name: /Miyembro ng Pamilya|Family Member/i });
    await expect(profileDialog).toBeVisible();

    // 3. Click "+ Magdagdag / + Add Member" button
    const addNewBtn = profileDialog.getByRole('button', { name: /\+ Magdagdag|\+ Add Member/i });
    await addNewBtn.click();

    // 4. Fill in primary form fields using getByPlaceholder & combobox
    const nameInput = profileDialog.getByPlaceholder(/Nanay Rosa|Dad|Mark/i);
    await nameInput.fill('Lola Remedios');

    // Select Role
    const roleSelect = profileDialog.getByRole('combobox');
    await roleSelect.selectOption('grandparent');

    // 5. Submit the Add Member form
    const saveMemberBtn = profileDialog.getByRole('button', { name: /I-save ang Miyembro|Save Member/i });
    await saveMemberBtn.click();

    // 6. Verify toast notification appears
    await expect(page.getByRole('status')).toBeVisible();

    // Close the profile modal
    await profileDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(profileDialog).not.toBeVisible();

    // 7. Verify the newly created profile appears in the top switcher bar
    const lolaChip = page.getByRole('button', { name: /Lola Remedios/i }).first();
    await expect(lolaChip).toBeVisible();

    // 8. Click to switch active user to Lola Remedios
    await lolaChip.click();
    await expect(page.getByText(/Lola Remedios:/i)).toBeVisible();
  });

  test('Scenario 3: Primary Form Submission - Doctor Prescription Translator (AddResetaModal)', async ({ page }) => {
    // 1. Navigate to the Meds & Stock tab via bottom navigation
    const medsTab = page.getByRole('button', { name: /Mga Gamot|Meds & Stock/i });
    await medsTab.click();

    // 2. Click "+ Magdagdag / Add Medicine" button
    const addMedBtn = page.getByRole('button', { name: /Magdagdag|Add Medicine/i }).first();
    await addMedBtn.click();

    // 3. Assert Add Prescription Modal appears
    const resetaDialog = page.getByRole('dialog', { name: /Magdagdag ng Gamot|Add Prescription/i });
    await expect(resetaDialog).toBeVisible();

    // 4. Test Quick Pill Chips for Popular PH Meds (e.g. Biogesic or Paracetamol)
    const biogesicChip = resetaDialog.getByRole('button', { name: /Biogesic/i });
    await expect(biogesicChip).toBeVisible();
    await biogesicChip.click();

    // Verify search input is auto-populated with chosen medicine
    await expect(resetaDialog.locator('#med-search')).toHaveValue(/Biogesic/i);

    // 5. Select Dose Amount Preset (e.g. "1 tablet")
    const dosePreset = resetaDialog.getByRole('button', { name: '1 tablet' });
    await dosePreset.click();

    // 6. Select Frequency (e.g. 3 beses sa isang araw / 3 times a day)
    const tidOption = resetaDialog.getByRole('button', { name: /3 beses sa isang araw|3 times a day/i });
    await tidOption.click();

    // 7. Select Meal Rule (e.g. Pagkatapos Kumain (+30 mins))
    const pcOption = resetaDialog.getByRole('button', { name: /Pagkatapos Kumain \(\+30 mins\)|After Meals \(\+30 mins\)/i });
    await pcOption.click();

    // 8. Assert Live Translated Daily Clock Schedule preview generated 3 dose slots
    await expect(resetaDialog.getByText(/Awtomatikong Oras|Daily Clock Schedule/i)).toBeVisible();
    await expect(resetaDialog.getByText(/1 of 3/i)).toBeVisible();

    // 9. Submit the primary prescription form
    const savePrescriptionBtn = resetaDialog.getByRole('button', {
      name: /I-save sa Aking Schedule|Save to My Schedule/i
    });
    await savePrescriptionBtn.click();

    // 10. Verify Modal closes and success toast appears
    await expect(resetaDialog).not.toBeVisible();
    await expect(page.getByRole('status')).toContainText(/Naidagdag na ang Biogesic|Added Biogesic/i);
  });

  test('Scenario 4: Routine Form Submission - Update meal times and verify schedule adaptation', async ({ page }) => {
    // 1. Click "Ayusin Oras" / "Edit Routine" in the header strip
    const editRoutineBtn = page.getByRole('button', { name: /Ayusin Oras|Edit Routine/i });
    await editRoutineBtn.click();

    // 2. Assert Routine Modal is open
    const routineDialog = page.getByRole('dialog', { name: /Daily Routine/i });
    await expect(routineDialog).toBeVisible();

    // 3. Update Breakfast time input
    const breakfastInput = page.locator('#routine-breakfastTime');
    await breakfastInput.fill('08:00');

    // 4. Save the routine form
    const saveRoutineBtn = routineDialog.getByRole('button', { name: /I-update ang Oras|Update Routine/i });
    await saveRoutineBtn.click();

    // 5. Assert modal closes and updated breakfast time displays on top banner
    await expect(routineDialog).not.toBeVisible();
    await expect(page.getByText(/8:00 AM/i)).toBeVisible();
  });

  test('Scenario 5: ResetaDrop P2P Modal - Open PIN pairing and receive view', async ({ page }) => {
    // 1. Click ResetaDrop button in top navigation bar
    const resetaDropBtn = page.getByRole('button', { name: /ResetaDrop/i });
    await resetaDropBtn.click();

    // 2. Verify ResetaDrop Dialog opens
    const dropDialog = page.getByRole('dialog', { name: /ResetaDrop/i });
    await expect(dropDialog).toBeVisible();

    // 3. Verify Send Mode displays Pairing PIN & QR Code
    await expect(dropDialog.getByText(/Pairing PIN/i)).toBeVisible();
    await expect(dropDialog.getByRole('button', { name: /Kopyahin ang PIN|Copy PIN/i })).toBeVisible();

    // 4. Switch to Receive Tab
    const receiveTab = dropDialog.getByRole('button', { name: /Tanggapin|Receive Schedule/i });
    await receiveTab.click();

    // Verify 6-digit PIN input is ready
    const pinInput = dropDialog.getByPlaceholder(/782-194/i);
    await expect(pinInput).toBeVisible();

    // 5. Close modal by clicking the close button
    await dropDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dropDialog).not.toBeVisible();
  });
});
