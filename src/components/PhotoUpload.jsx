import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Camera, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PhotoUpload = ({ onPhotosUploaded, existingPhotos = [] }) => {
    const { user } = useContext(AuthContext);
    const [uploading, setUploading] = useState(false);
    const [photos, setPhotos] = useState(existingPhotos);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();

        if (files.length === 1) {
            formData.append('photo', files[0]);
            try {
                const config = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const { data } = await axios.post('http://localhost:5000/api/upload', formData, config);
                const newPhotos = [...photos, data.url];
                setPhotos(newPhotos);
                onPhotosUploaded(newPhotos);
                toast.success('Photo uploaded!');
            } catch (error) {
                console.error(error);
                toast.error('Upload failed');
            }
        } else {
            files.forEach(file => formData.append('photos', file));
            try {
                const config = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const { data } = await axios.post('http://localhost:5000/api/upload/multiple', formData, config);
                const newPhotos = [...photos, ...data.files.map(f => f.url)];
                setPhotos(newPhotos);
                onPhotosUploaded(newPhotos);
                toast.success(`${files.length} photos uploaded!`);
            } catch (error) {
                console.error(error);
                toast.error('Upload failed');
            }
        }
        setUploading(false);
    };

    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onPhotosUploaded(newPhotos);
    };

    return (
        <div className="photo-upload">
            <div className="upload-buttons">
                <label className="upload-btn">
                    <Camera size={18} />
                    <span>{uploading ? 'Uploading...' : 'Take Photo'}</span>
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </label>
                <label className="upload-btn">
                    <Upload size={18} />
                    <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>

            {photos.length > 0 && (
                <div className="photo-grid">
                    {photos.map((photo, index) => (
                        <div key={index} className="photo-item">
                            <img src={photo} alt={`Upload ${index + 1}`} />
                            <button className="remove-btn" onClick={() => removePhoto(index)}>
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
        .photo-upload { margin: 15px 0; }
        .upload-buttons { display: flex; gap: 10px; margin-bottom: 15px; }
        .upload-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--primary-color);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: opacity 0.2s;
        }
        .upload-btn:hover { opacity: 0.9; }
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }
        .photo-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
        }
        .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
      `}</style>
        </div>
    );
};

export default PhotoUpload;
