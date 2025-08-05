import whisper from "whisper-node";
import path from "node:path";


const transcribeController = async (req, res) => {
  try {
    const { url } = req.body;
    const filePath = path.join(__dirname, "./oneHourAudio.mp3");

    const options = {
      modelName: "base.en", // default
      // modelPath: "/custom/path/to/model.bin", // use model in a custom directory (cannot use along with 'modelName')
      whisperOptions: {
        language: "en", // default (use 'auto' for auto detect)
        gen_file_txt: false, // outputs .txt file
        gen_file_subtitle: false, // outputs .srt file
        gen_file_vtt: false, // outputs .vtt file
        word_timestamps: true, // timestamp for every word
        // timestamp_size: 0      // cannot use along with word_timestamps:true
      },
    };

    const transcript = await whisper(filePath, options);

    return res.status(200).json({
      message: "Audio transcribed",
      status: "success",
      transcript: transcript,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error,
    });
  }
};

export { transcribeController };
