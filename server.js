import express from 'express'
import path from 'node:path'
import multer from 'multer'
import PDFMerger from 'pdf-merger-js'
import fs from 'fs'

const app = express()
const port = 3000
const __dirname = path.resolve()

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' })

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.post('/merge', upload.array('pdfs', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files uploaded')
    }

    const merger = new PDFMerger()

    // Add all uploaded PDFs to merger
    for (const file of req.files) {
      await merger.add(file.path)
    }

    // Generate output filename
    const outputPath = path.join('uploads', `merged-${Date.now()}.pdf`)

    // Merge and save
    await merger.save(outputPath)

    // Send file to client
    res.download(outputPath, 'merged.pdf', (err) => {
      if (err) console.error('Download error:', err)

      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err)
        })
      })

      // Clean up merged file
      fs.unlink(outputPath, (err) => {
        if (err) console.error('Error deleting merged file:', err)
      })
    })
  } catch (error) {
    console.error('Merge error:', error)
    res.status(500).send('Error merging PDFs: ' + error.message)
  }
})

app.listen(port, () => {
  console.log(`PDF Merge app listening on http://localhost:${port}`)
})