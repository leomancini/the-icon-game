// setup
var icon = {};
var title;
var in_device;
var current_time_seconds;

// setup game variables
var game = {};
game.position_change_per_second_default = 55; // default velocity in pixels per second
game.position_change_per_second = game.position_change_per_second_default; // set velocity to default
game.is_running = false; // game state
game.score = 0; // current game score
game.last_animation_time = 0; // start animation time at 0
game.icon_click_log = []; // log of icon clicks
game.streak_counter = 0; // number of streaks in this game
game.streak_threshold_n_seconds = 3; // how long to count clicks for streak
game.streak_threshold_clicks_per_n_seconds = 4; // number of clicks within the last streak_threshold_n_seconds to qualify as a streak
game.streak_notification_show_for = 1500; // ms to show streak notifcation

// set icon dimension range
icon.size_max = 100;
icon.size_min = 10;

// set icon points range
icon.points_min = 1;
icon.points_max = 10;

// set score thresholds for showing rewards
var score_threshold = [];
var has_passed_score_threshold = [];

score_threshold[1] = 25;
has_passed_score_threshold[1] = false;

score_threshold[2] = 100;
has_passed_score_threshold[1] = false;

// main game animation loop (runs every frame)
function animation(current_time) {
	// only do game logic and update rendering if game state is not paused
	if(game.is_running ) {
		// get current time in seconds
		current_time_seconds = Math.round(current_time / 1000);	
		
		// if no icons have been clicked this second, add 0 to the log for the current second
		if(!game.icon_click_log[current_time_seconds]) {
			game.icon_click_log[current_time_seconds] = 0;
		}
	
		// if last_animation_time = 0, we are at first frame
		// or if difference between current time and last animation time marker is less than 1000ms, another second has passed
		// make an icon appear every second
		if(game.last_animation_time == 0 || current_time - game.last_animation_time >= 1000) {

			// update last animation time marker to current time
			game.last_animation_time = current_time;
		
			// set size by picking a random number between pre-determined min and max
			icon.size_value = Math.floor(Math.random() * (icon.size_max - icon.size_min + 1) + icon.size_min);
			
			// set value by converting range of min/max size to min/max points
			icon.points_value = (((icon.size_value - icon.size_min) / (icon.size_max - icon.size_min)) * (icon.points_min - icon.points_max) + icon.points_max).toFixed(1);
			
			// set horizontal position by picking a random number smaller than (viewport width minus the icon size's value) 
			icon.horizontal_position_max = ($("#desktop").width() - icon.size_value);
			icon.horizontal_position_value = Math.floor((Math.random() * icon.horizontal_position_max));
			
			// set the image by picking a number smaller than # of icons in /resources/images/icons
			icon.image = Math.floor(Math.random() * (68 + 1));
					
			// add this new icon to the icon set
			$("#icons").append("<div class='icon' id='icon_"+current_time_seconds+"' data-points-value='"+icon.points_value+"' style='left:"+icon.horizontal_position_value+"px; width:"+icon.size_value+"px; height:"+icon.size_value+"px; background-image: url("+base_image_url+icon.image+".png);'></div>");
		}
		
		// for each icon on the screen
		$(".icon").each(function() {
			// get current position
			var current_position = parseFloat($(this).css("top").replace("px", ""));

			// get the current velocity (set by user)
			var position_change_per_second = game.position_change_per_second;
			
			// convert current velocity from per second to per frame by dividing by fps
			var position_change_per_frame = position_change_per_second / 60;
			
			// figure out new position by adding amount position should change to current position
			var new_position = current_position + position_change_per_frame;

			// set the position of icon to the new position
			$(this).css("top", new_position + "px");
		
			// when an icon goes out of frame, remove it from the DOM
			if(($(".icon").css("top").replace("px", "") - $(".icon").height()) > window.outerHeight) {
				$(this).remove();
			}
		});
		
		// loop the animation
		requestAnimationFrame(animation);
	}
}

function toggle_game_state() {
	// if this is the first play, enter full screen
	if(game.last_animation_time == 0 && in_device) {
		toggle_in_device(); // function defined in desktop.js
	}
	
	if(game.is_running) {
		// if the game is running, set attributes to paused version
		$("#toggle-game-state").addClass("blue").children("label").html("Start");
		$("#menu-bar-icon-toggle-game-state").addClass("paused");
		$(document).attr("title", title+": PAUSED");
		$("#paused-curtain").css("opacity", 1);
		if(has_passed_score_threshold[2]) {
			$(".desktop-picture#itunes-visualizer video")[0].pause();
		}
	} else {
		// if the game is running, set attributes to in progress version
		requestAnimationFrame(animation);
		$("#toggle-game-state").removeClass("blue").children("label").html("Pause");
		$("#menu-bar-icon-toggle-game-state").removeClass("paused");
		$(document).attr("title", title+": Game in Progress");
		$("#paused-curtain").css("opacity", 0);
		if(has_passed_score_threshold[2]) {
			$(".desktop-picture#itunes-visualizer video")[0].play();
		}
	}

	// flip state variable
	game.is_running = !game.is_running;
}

$(document).keyup(function(keyboard) {
	// if SPACE key is pressed on keyboard, toggle game state
	var space_key_code = 32;
	if(keyboard.keyCode == space_key_code){
		toggle_game_state();
	}
}).on("click", ".icon", function() {
	// if icon is clicked while game is running
	if(game.is_running) {
		// get points value and add it to the current score
		var points_value = parseFloat($(this).data("points-value"));
		game.score = game.score + points_value;
		
		// update score value rendering
		$(".score").html(game.score.toFixed(0));
		
		// hide this icon
		// "caught" class also removes pointer-events so it doesn't block clicks to other icons
		$(this).addClass("caught");
		game.icon_click_log[current_time_seconds]++;
		game.icon_click_log_last_n_seconds = game.icon_click_log.slice(Math.max(game.icon_click_log.length - game.streak_threshold_n_seconds, 0));
	
		// start streak counter
		var streak = 0;
		
		// set streak to sum of clicks in last n seconds
		for(var i = 0; i < game.icon_click_log_last_n_seconds.length; i++ ) {
			if(!isNaN(game.icon_click_log_last_n_seconds[i])) {
				streak += parseInt(game.icon_click_log_last_n_seconds[i], 10); 
			}
		}
				
		// if streak is more than streak threshold, show streak notification
		if(streak >= game.streak_threshold_clicks_per_n_seconds) {
			game.streak_counter++; // not used but could be for showing number streaks in game
			show_and_bring_window_id_to_front("streak-notification"); // function defined in desktop.js
			setTimeout(function() {
				$(".window#streak-notification").hide();
			}, game.streak_notification_show_for);
		} else {
			game.streak_counter = 0;
		}
		
		// logic for score thresholds
		
		// if score is most recently greater than first score threshold
		if(game.score >= score_threshold[1] && !has_passed_score_threshold[1]) {
			
			// delay after icon click because icon click puts all windows into background
			setTimeout(function() {
				// show QuickTime window
				show_and_bring_window_id_to_front("quicktime"); // function defined in desktop.js
				
				// remove from DOM app unavailable window for QuickTime
				$("#app-unavailable-window-quicktime").remove();
			}, 100);
			
			// update QuickTime dock icon click behavior
			$(".dock-icon[data-app-id=quicktime]").addClass("open").unbind("click").click(function() {
				show_and_bring_window_id_to_front("quicktime"); // function defined in desktop.js
			});
			
			// remember that score threshold has been hit
			has_passed_score_threshold[1] = true;
		}
		
		// if score is most recently greater than second score threshold
		if(game.score >= score_threshold[2] && !has_passed_score_threshold[2]) {
			// play visualizer
			$(".desktop-picture#itunes-visualizer video")[0].play();
			
			// show visualizer
			$(".desktop-picture#itunes-visualizer").css("opacity", 1);
			
			// hide QuickTime window
			$(".window#quicktime").hide();
			
			// remember that score threshold has been hit
			has_passed_score_threshold[2] = true;
		}
	}
});

$(window).blur(function() {
	if(game.last_animation_time > 0 && game.is_running) {
		show_and_bring_window_id_to_front("finder"); // function defined in desktop.js
		toggle_game_state();
	}
});