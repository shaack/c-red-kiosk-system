# Kiosk System with Touch Display

I want to make a kiosk system with a touch display. In the folder /model are some models how to build it.

## Models

### /models/index.png

The start page. The gray (not white) tiles from folder /assets/tiles-x2 are shown here. Seven in a row and three rows, independent of the screen size. Stretch the tiles to fit the browser-size.

When touched (clicked) on a tile, the associated Video from /assets/videos is shown and directly played.

### /models/player_playing.png

The video player is shown here while it is playing. The white tile from folder /assets/tiles-x2 is shown here in the lower right corner. Other UI elements are not shown here.

### /models/player_touched.png

When touched (clicked) on the screen, the video is paused and the UI elements are shown:

- The scrubbing bar in white on the bottom. It goes from left to right, but the scrubbing area is only from left to the left edge of the tile to the right.
- On the scrubbing bar is the scrubber (/assets/ui-elements/scrubber.svg) in red. The user can scrub to another position in the video.
- A play button (/assets/ui-elements/button_play.svg) in the center to continue playing the video.

## Other requirements

- When the video ends (/models/player_end_position.png), automatically go back to the start page. 
- When the video is paused longer than 3 minutes, go back to the start page.
- When the X (/assets/ui-elements/button_close.svg) is touched, go back to the start page.
