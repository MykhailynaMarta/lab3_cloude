
import { useState } from "react";

function App() {
    const [model, setModel] = useState("bonsai-2:2b");
    const [host, setHost] = useState("http://localhost:11434");
    const [stream, setStream] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [output, setOutput] = useState("");
    const [image, setImage] = useState(null);

    // Convert image to Base64
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const base64 = reader.result.split(",")[1];
                resolve(base64);
            };

            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    }

    // Send request to Ollama
    const handleSend = async (e) => {
        e.preventDefault();

        if (!model || !prompt.trim()) {
            setOutput("Please select a model and enter a prompt.");
            return;
        }

        try {
            setOutput("Loading...");

            console.log("Selected model:", model);
            console.log("Selected image:", image);
            console.log("Prompt:", prompt);

            if (model === "snowflake-arctic-embed2:latest") {
  // EMBEDDING MODEL
  const response = await fetch(`${host}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      input: prompt
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  setOutput(
    `Embedding успішно створено!\n
Розмірність вектора: ${data.embeddings[0].length}\n
Перші 10 значень:\n${data.embeddings[0].slice(0, 10).join(", ")}`
  );

} else {
  // CHAT MODEL
  const message = { role: "user", content: prompt };

  if (image) {
    message.images = [await convertImageToBase64(image)];
  }

  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [message],
      stream: stream,
      options: { num_ctx: 2048, num_predict: 512 }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error: ${response.status}`);
  }

if (stream) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      const data = JSON.parse(line);

      const content =
        data.message?.content ||
        "";

      result += content;
      setOutput(result);
    }
  }

  const remaining = decoder.decode();
  if (remaining.trim()) {
    const data = JSON.parse(remaining);
    result += data.message?.content || "";
    setOutput(result);
  }

} else {
  const data = await response.json();

  setOutput(
    data.message?.content ||
    data.message?.thinking ||
    "Model returned an empty response"
  );
}
}
        } catch (error) {
            console.error(error);
            setOutput(`Error: ${error.message}`);
        }
    };

    // Clear form
    const handleClear = () => {
        setModel("bonsai-2:2b");
        setHost("http://localhost:11434");
        setStream(false);
        setPrompt("");
        setOutput("");
        setImage(null);
    };

    return (
        <div>
            <div className="form-wrapper">

                <h2>Ollama Client</h2>

                <form onSubmit={handleSend}>

                    <label htmlFor="model">Model</label>

                    <select
                        id="model"
                        name="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    >
                        <option value="snowflake-arctic-embed2:latest">
                            snowflake-arctic-embed2:latest
                        </option>

                        <option value="bonsai-2:2b">
                            bonsai-2:2b
                        </option>
                    </select>

                    <label htmlFor="host">Host:</label>

                    <input
                        id="host"
                        name="host"
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                    />

                    <label>
                        <input
                            name="stream"
                            type="checkbox"
                            checked={stream}
                            onChange={(e) => setStream(e.target.checked)}
                        />
                        stream
                    </label>

                    <label htmlFor="prompt">
                        Prompt (chat user message):
                    </label>

                    <textarea
                        id="prompt"
                        name="prompt"
                        rows="10"
                        cols="80"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />

                    <div>
                        <label htmlFor="image">Choose an image:</label>

                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setImage(e.target.files[0] || null)
                            }
                        />

                        {image && (
                            <p>Selected: {image.name}</p>
                        )}
                    </div>

                    <button type="submit">
                        Send/api/chat
                    </button>

                    <button type="button" onClick={handleClear}>
                        Clear
                    </button>

                    <h4>Output</h4>

                    <textarea
                        rows="10"
                        cols="80"
                        value={output}
                        readOnly
                    />

                </form>
            </div>
        </div>
    );
}

export default App;
