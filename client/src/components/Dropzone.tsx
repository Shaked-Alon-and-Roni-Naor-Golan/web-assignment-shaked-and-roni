import { useDropzone } from "react-dropzone";

interface DropzoneComponentProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  height?: string;
  width?: string;
}

const DropzoneComponent = ({
  onFileSelect,
  selectedFile,
  width,
  height,
}: DropzoneComponentProps) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
    },

    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div className="form-group">
      <div
        {...getRootProps({
          className:
            "dropzone rounded-circle border d-flex justify-content-center align-items-center",
        })}
        className="dropzone d-flex justify-content-center align-items-center m-1"
        style={{ border: "2px", borderRadius: "5px" }}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <img
            style={{
              ...(height && { height }),
              ...(width && { width }),
              boxShadow: " rgba(0, 0, 0, 0.24) 0px 3px 8px",
            }}
            className="img-fluid"
            src={URL.createObjectURL(selectedFile)}
          />
        ) : (
          <div className="text-center">
            <img
              src="/src/assets/blank_image.jpg"
              style={{
                ...(height && { height }),
                ...(width && { width }),
                boxShadow: " rgba(0, 0, 0, 0.24) 0px 3px 8px",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DropzoneComponent;
