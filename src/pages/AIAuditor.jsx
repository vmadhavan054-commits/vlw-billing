import React, { useState, useRef, useEffect } from 'react'
import { Bot, Upload, Paperclip, Send, Loader2, FileCheck, CheckCircle2 } from 'lucide-react'

export default function AIAuditor({ store }) {
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: "Hello! I am your AI Auditor. Upload your supplier purchase bills (images or PDFs), and I'll extract the items and add them to your Purchases automatically." }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Show user message with file attachments
    const fileNames = files.map(f => f.name).join(', ')
    const userMsg = { id: Date.now().toString(), role: 'user', text: `Uploaded ${files.length} file(s): ${fileNames}`, isFile: true }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Simulate AI processing (OCR & extraction) for multiple files
    setTimeout(() => {
      setIsTyping(false)
      
      files.forEach((file, index) => {
        // Simulate extracted data for each file
        const simulatedData = {
          supplier: index % 2 === 0 ? 'ABC Distributors' : 'XYZ Auto Parts',
          invoiceNo: `INV-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString().slice(0, 10),
          items: [
            { name: `Item from ${file.name.slice(0,5)}`, qty: Math.floor(Math.random() * 10) + 1, rate: 500 + Math.floor(Math.random() * 1000), gstPercent: 18 }
          ]
        }

        // Add to store
        simulatedData.items.forEach(item => {
          const existingProduct = store.data.products.find(p => p.name.toLowerCase().includes('leather') || p.name.toLowerCase().includes('adhesive'))
          const total = (item.qty * item.rate) * (1 + (item.gstPercent / 100))
          
          store.addPurchase({
            supplier: simulatedData.supplier,
            invoiceNo: simulatedData.invoiceNo,
            date: simulatedData.date,
            productId: existingProduct?.id || '',
            productName: item.name,
            qty: item.qty,
            rate: item.rate,
            gstPercent: item.gstPercent,
            total: total
          })
        })

        // Send AI confirmation message for each file
        const aiMsg = { 
          id: (Date.now() + index + 1).toString(), 
          role: 'ai', 
          text: `Processed **${file.name}** (${simulatedData.supplier}).\n\nExtracted items:\n${simulatedData.items.map(i => `- ${i.qty}x ${i.name} (₹${i.rate})`).join('\n')}`,
          success: true
        }
        setMessages(prev => [...prev, aiMsg])
      })
    }, 2500 + (files.length * 500))
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-canvas">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Bot size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 leading-tight">AI Auditor</h1>
          <p className="text-xs font-medium text-ink-600">Smart Bill Entry & Data Extraction</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-ink-900/10 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Chat window */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-ink-900 text-white rounded-br-sm' : 'bg-canvas text-ink-900 border border-ink-900/5 rounded-bl-sm'}`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bot size={14} className="text-purple-600" />
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">AI Auditor</span>
                  </div>
                )}
                {msg.isFile ? (
                  <div className="flex items-center gap-2">
                    <FileCheck size={16} className="text-white/70" />
                    <span className="font-medium">{msg.text}</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                )}
                {msg.success && (
                  <div className="mt-3 flex items-center gap-1.5 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-lg w-max border border-green-200">
                    <CheckCircle2 size={14} /> Saved to Purchases
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-canvas border border-ink-900/5 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-purple-600" />
                <span className="text-sm font-medium text-ink-600">Analyzing bill using AI...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 bg-white border-t border-ink-900/10">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="hidden" 
              multiple
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900/5 text-ink-600 transition hover:bg-ink-900/10 hover:text-ink-900"
              title="Attach Purchase Bill"
            >
              <Paperclip size={20} />
            </button>
            <div className="flex-1 bg-ink-900/5 rounded-xl flex items-center px-4 h-11 border border-transparent focus-within:border-ink-900/20 focus-within:bg-white transition-colors">
              <input 
                type="text" 
                placeholder="Upload a bill and I'll process it..." 
                className="w-full bg-transparent text-sm focus:outline-none" 
                disabled
              />
            </div>
            <button 
              className="flex h-11 px-4 items-center gap-2 rounded-xl bg-ink-900 text-white transition hover:bg-black font-semibold text-sm shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> <span className="hidden sm:inline">Upload Bill</span>
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-ink-400 font-medium uppercase tracking-widest">
            AI Auditor handles images (JPG/PNG) & PDFs
          </div>
        </div>
      </div>
    </div>
  )
}
