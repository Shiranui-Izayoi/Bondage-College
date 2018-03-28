// Chapter 9 - Outro Load
function C009_Library_Outro_Load() {
	
	// Time is always 15:15:00 in the outro, unlock if needed
	StopTimer(15.25 * 60 * 60 * 1000);
	PlayerReleaseBondage();
	PlayerUnlockAllInventory();
	PlayerClothes("Clothed");
	ActorSpecificClearInventory("Jennifer", false);
	ActorSpecificSetPose("Jennifer", "");
	if (C009_Library_Library_StuckInHole) GameLogAdd(CurrentChapter, "Player", "StuckInHole");

}

// Chapter 9 - Outro Run
function C009_Library_Outro_Run() {
	
	// Paints the background
	DrawRect(0, 0, 800, 600, "black");
	DrawImage(CurrentChapter + "/" + CurrentScreen + "/Bell.jpg", 800, 0);

	// Get the correct outro text depending on how the chapter ended
	var OutroText = "Outro";
	if (C009_Library_Library_StuckInHole) OutroText = "StuckInHole";
	
	// Draw the outro text to lead to chapter 11
	DrawText(GetText(OutroText + "1"), 400, 150, "White");
	if (TextPhase >= 1) DrawText(GetText(OutroText + "2"), 400, 250, "White");
	if (TextPhase >= 2) DrawText(GetText(OutroText + "3"), 400, 350, "White");
	if (TextPhase >= 3) DrawText(GetText(OutroText + "4"), 400, 450, "White");

}

// Chapter 9 - Outro Click
function C009_Library_Outro_Click() {

	// Jump to the next animation
	TextPhase++;
	if (TextPhase >= 4) SaveMenu("C101_KinbakuClub", "Intro");

}