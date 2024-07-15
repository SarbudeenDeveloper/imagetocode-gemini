import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isGenerating) {
      setGeneratedHtml("");
    }
  }, [isGenerating]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    setIsGenerating(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setGeneratedHtml(response.data.code);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  };

  return (
    <div className="App">
      <h1>UI Code Generator</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">{isGenerating ? "Generating" : "Upload"}</button>
      </form>
      {selectedFile && (
        <div>
          <h2>Selected Image:</h2>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Selected"
            style={{ maxWidth: "50%", height: "auto" }}
          />
        </div>
      )}
      {generatedHtml && (
        <div>
          <h2>Generated HTML:</h2>
          <pre>{generatedHtml}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
