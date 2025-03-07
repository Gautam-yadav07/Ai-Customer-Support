'use client'
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react"

export default function Home() {
    <Analytics />
    const [messages, setMessages] = useState([{
        role: "assistant", 
        content: "Hi, I am your Support Agent, how can I assist you today?"
    }]);

    const [message, setMessage] = useState('');
    
    const MAX_BUBBLE_LENGTH = 500; // max char count for output
    const MAX_SENTENCES = 5; 

    const messagesEndRef = useRef(null);

    // auto scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // text parser
    const splitTextIntoChunks = (text, maxLength) => {
        const chunks = [];
        let currentChunk = '';
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                // handles bullet point output -- TODO: newlines for each bullet point 
                const bulletPoint = `${trimmedLine}\n`;
                if ((currentChunk + bulletPoint).length <= maxLength) {
                    currentChunk += bulletPoint;
                } else {
                    chunks.push(currentChunk);
                    currentChunk = bulletPoint;
                }
            } else {
                // regular lines
                if ((currentChunk + (currentChunk ? ' ' : '') + line).length <= maxLength) {
                    currentChunk += (currentChunk ? ' ' : '') + line;
                } else {
                    chunks.push(currentChunk);
                    currentChunk = line;
                }
            }
        });

        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    };
    
    //splits text by periods and question marks, but not false splits like Mr. or Mrs.
    const limitTextToSentences = (text, maxSentences) => {
        const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/); 
        return sentences.slice(0, maxSentences).join(' ');
    };

    const sendMessage = async () => {
        setMessage("");
        setMessages((messages) => [
            ...messages, 
            { role: "user", content: message }, 
            { role: "assistant", content: "" },
        ]);
        
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify([...messages, { role: "user", content: message }])
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (data.message) {
            const cleanText = data.message.replace(/^\*\*.*\*\*[\s\S]*?---\s+/, ''); 
            const limitedText = limitTextToSentences(cleanText, MAX_SENTENCES);
            const responseText = `${limitedText} Would you like to know more?`;
            const chunks = splitTextIntoChunks(responseText, MAX_BUBBLE_LENGTH);

            setMessages((messages) => [
                ...messages.slice(0, -1),
                ...chunks.map(chunk => ({
                    role: "assistant",
                    content: chunk
                }))
            ]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // enter key pressed without Shift (i.e., not a newline)
            e.preventDefault(); // prevents the default newline behavior
            sendMessage(); // trigger the send action
        }
    };

    return (
        <>
<Box 
    position="fixed" 
    bottom={20} 
    right={20} 
    width="350px" 
    height="500px"
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
    bgcolor="white"
    borderRadius={4}
    boxShadow="0 4px 8px rgba(0,0,0,0.2)"
> 
    {/* Title Bar */}
    <Box 
        width="100%" 
        bgcolor="#14BF96" 
        color="white" 
        p={1}   // Padding kam kiya
        textAlign="center"
    >
        <Typography variant="h6" fontSize="1rem">AI Support</Typography> 
    </Box>

    {/* Chat Messages */}
    <Stack 
        direction="column" 
        spacing={2}
        flexGrow={1} // Yeh ensure karega ki chat area adjustable ho
        overflow="auto"
        p={2}
    >
        {messages.map((message, index) => (
            <Box key={index} display="flex" justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}>
                <Box bgcolor={message.role === "assistant" ? "#66C7C2" : "#C3F0E0"}
                    color="black"
                    borderRadius={16}
                    p={2}
                    maxWidth="85%"
                    boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                    sx={{ wordBreak: 'break-word' }}
                >
                    {message.content}
                </Box>
            </Box>
        ))}
        <div ref={messagesEndRef} />
    </Stack>

    {/* Input Field and Send Button */}
    <Stack direction="row" spacing={1} p={1} alignItems="center">
        <TextField 
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            variant="outlined"
            size="small" // Chhota banaya
        />
        <Button 
            variant="contained" 
            color="primary" 
            onClick={sendMessage}
            sx={{ minWidth: "70px", fontSize: "0.8rem", px: 1 }}
        >
            Send
        </Button>
    </Stack>
</Box>

            <Analytics />
        </>
    );
}