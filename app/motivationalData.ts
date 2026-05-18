import { Asset } from "expo-asset";

export const motivationalSpeeches = [
  {
    text: "You are capable of amazing things. Keep pushing!",
    audioUrl: Asset.fromModule(require("../assets/audio/speech1.mp3")).uri,
    videoUrl: Asset.fromModule(require("../assets/video/vid1.mp4")).uri,
  },
  {
    text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    audioUrl: Asset.fromModule(require("../assets/audio/speech2.mp3")).uri,
    videoUrl: Asset.fromModule(require("../assets/video/vid1.mp4")).uri,
  },
];
export default motivationalSpeeches;
