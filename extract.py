import PyPDF2
reader = PyPDF2.PdfReader('NNT_CV_Tech_vie.pdf')
text = '\n'.join([page.extract_text() for page in reader.pages])
with open('cv.txt', 'w', encoding='utf-8') as f:
    f.write(text)
