import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker with matching version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ProcessedFile {
  type: 'pdf' | 'ppt' | 'image';
  content: string;
  fileName: string;
  requiresVision?: boolean;
}

export const processPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
    
    return fullText;
  } catch (error) {
    throw new Error('Failed to process PDF file');
  }
};

export const processPPTAsImage = async (file: File): Promise<string> => {
  // Convert PPT file to base64 for vision analysis
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read PowerPoint file'));
    };
    reader.readAsDataURL(file);
  });
};

export const processFile = async (file: File): Promise<ProcessedFile> => {
  const fileName = file.name;
  const fileType = file.type;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  if (fileType === 'application/pdf' || fileExtension === 'pdf') {
    const content = await processPDF(file);
    return { type: 'pdf', content, fileName };
  } else if (
    fileType === 'application/vnd.ms-powerpoint' ||
    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    fileExtension === 'ppt' ||
    fileExtension === 'pptx'
  ) {
    // For PPT files, we'll send them as images to vision AI
    const content = await processPPTAsImage(file);
    return { 
      type: 'ppt', 
      content, 
      fileName,
      requiresVision: true 
    };
  } else if (fileType.startsWith('image/')) {
    // For images, compress and return base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to resize image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 2048px on longest side for better quality)
          let width = img.width;
          let height = img.height;
          const maxSize = 2048; // Increased from 1024 for better quality
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with adaptive compression
          // Start with higher quality, reduce if needed
          let quality = 0.85;
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large (>10MB base64), reduce quality
          const maxBase64Size = 10 * 1024 * 1024; // 10MB in base64
          while (compressedBase64.length > maxBase64Size && quality > 0.5) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Log compression results
          const originalSize = (e.target?.result as string).length;
          const compressedSize = compressedBase64.length;
          
          resolve({
            type: 'image',
            content: compressedBase64,
            fileName,
            requiresVision: true
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  } else {
    throw new Error('Unsupported file type. Please upload PDF, PPT/PPTX, or image files.');
  }
};
