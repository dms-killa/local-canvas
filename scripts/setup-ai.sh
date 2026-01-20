#!/bin/bash
# Setup script for local AI service layer

echo "Setting up local AI service layer..."

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "Ollama is already installed"
else
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Check if model is already downloaded
if ollama list | grep -q "mistral"; then
    echo "Mistral model already available"
else
    echo "Pulling Mistral model..."
    ollama pull mistral
fi

# Start Ollama server
echo "Starting Ollama server..."
ollama serve &

# Wait for server to start
sleep 5

# Test connection
if curl -s http://localhost:11434 > /dev/null; then
    echo "Ollama server is running and accessible"
else
    echo "Error: Could not connect to Ollama server"
    exit 1
fi

echo "Local AI service layer setup complete."
