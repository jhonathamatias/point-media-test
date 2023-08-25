import { useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import download from 'js-file-download';

import GoogleSheetsApi, { Sheet } from './GoogleSheetsApi';

import { baseStyle, focusedStyle, acceptStyle, rejectStyle } from './styles';
import './styles.css';

interface HTMLFiles {
  fileName?: string;
  content?: string;
}

const zip = JSZip();

function App() {
  const [sheet, setSheet] = useState<Sheet[] | null>();
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [htmlFiles, setHtmlFiles] = useState<HTMLFiles[]>();

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject
  } = useDropzone();

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isFocused ? focusedStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isFocused,
    isDragAccept,
    isDragReject
  ]);

  useEffect(() => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const reader = new FileReader();

    reader.addEventListener('load', event => {
      const htmlContent = event.target?.result as string;
      const files: HTMLFiles[] = [];

      if (!htmlContent) {
        return;
      }

      if (!sheet) {
        return;
      }

      const textsModelo = sheet[0];
      const fileNames = sheet[1];

      textsModelo.rows.forEach((row, index) => {
        files[index] = {
          content: htmlContent.replace(/<p class="text_modelo">.*<\/p>/, `<p class="text_modelo">${row}</p>`),
        };
      });

      fileNames.rows.forEach((row, index) => {
        files[index] = {
          ...files[index],
          fileName: `${row}.html`,
        };
      });

      setHtmlFiles(files)
    });

    reader.readAsText(acceptedFiles[0]);
  }, [acceptedFiles, sheet]);

  useEffect(() => {
    if (!spreadsheetId) {
      return;
    }

    const googleSheetsApi = new GoogleSheetsApi(spreadsheetId);

    (async () => {
      const sheet = await googleSheetsApi.getSheetData();

      if (!sheet) {
        alert('Ocorreu um erro ao buscar a planilha!');

        return;
      }

      setSheet(sheet);
      alert('Planilha carregada com sucesso!');
    })();
  }, [spreadsheetId]);

  const handleDownloadZip = () => {
    if (!htmlFiles?.length) {
      return;
    }

    htmlFiles.forEach((htmlFile) => {
      zip.file(htmlFile?.fileName as string, htmlFile.content as string);
    });

    zip.generateAsync({ type: 'blob' }).then(blobdata => {
      const zipblob = new Blob([blobdata]);

      download(zipblob, `pointmedia.zip`);
    });
  }
  const files = acceptedFiles.map(file => (
    <p key={file.name}>
      {file.name}
    </p>
  ));

  return (
    <div className="container">
      <div className="main">
        <div className="spreadsheet-search">
          <input
            className="spreadsheet-search-input"
            type="text"
            placeholder="Cole o spreadsheet id"
            onChange={e => setSpreadsheetId(e.target.value)}
          />
        </div>

        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p>Arraste os arquivos aqui</p>
        </div>
        <div className="info-files">
          <h3>Arquivos:</h3>
          {files}
        </div>

        <button className="download" onClick={() => handleDownloadZip()}>Gerar arquivos</button>
      </div>
    </div>
  );
}

export default App;
