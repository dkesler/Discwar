var settings = {
    "playerRadius" : 30,
    "objectRadius" : 10,
    "maxWidth" : 800,
    "maxHeight" : 800,
    "boardRadius" : 350,
    "maxVel" : 7,
    "powerupMassAdjustment" : .2,
    "powerupMaxAccAdjustment" : .1,
    "maxPowerups" : 2,
    "defaultPlayerMass" : 1,
    "defaultPlayerMaxAcc" : 0.8,
    "neutralObjectMass" : 0.5,
    "minFramesPerObject" : 60,
    "maxFramesPerObject" : 5000,
    "minFramesPerPowerup" : 60,
    "maxFramesPerPowerup" : 5000
};

function loadSettings() {
    var div = $("#settings");
    for (s in settings) {
	div.append("<label>" + s + ":</label><input type='text' id='" + s + "' value='" + settings[s] + "' /></br>");
	settingInput = $("#" + s);
	settingInput.change(createSettingsChangeMethod(s));
    }
}


function createSettingsChangeMethod(setting) {
    return function(e) {
	settings[setting] = parseFloat($(this).val());
    };
}
