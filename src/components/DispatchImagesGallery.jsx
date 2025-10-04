import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { getDispatchImages, groupImagesByDriver } from '../services/data/dispatchImageService';
import { subscribeToDrivers } from '../services/data';

const DispatchImagesGallery = ({ dispatchId, onClose }) => {
  const [images, setImages] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [groupedImages, setGroupedImages] = useState([]);

  useEffect(() => {
    let unsubscribeDrivers;

    // Subscribe to drivers data
    unsubscribeDrivers = subscribeToDrivers((driversData) => {
      setDrivers(driversData);
    });

    // Load dispatch images
    const loadImages = async () => {
      try {
        console.log(`🖼️ DispatchImagesGallery: Loading images for dispatch ${dispatchId}`);
        console.log(`🖼️ DispatchImagesGallery: Dispatch ID type:`, typeof dispatchId);
        console.log(`🖼️ DispatchImagesGallery: Dispatch ID value:`, dispatchId);
        const dispatchImages = await getDispatchImages(dispatchId);
        console.log(`🖼️ DispatchImagesGallery: Received ${dispatchImages.length} images`);
        setImages(dispatchImages);
      } catch (error) {
        console.error('❌ Error loading dispatch images:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();

    return () => {
      unsubscribeDrivers?.();
    };
  }, [dispatchId]);

  useEffect(() => {
    if (images.length > 0 && drivers.length > 0) {
      const grouped = groupImagesByDriver(images, drivers);
      setGroupedImages(grouped);
    }
  }, [images, drivers]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <FontAwesomeIcon icon={['fas', 'camera']} className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">No images uploaded for this dispatch</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-6">
          {groupedImages.map((group) => (
            <div key={group.driver.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              {/* Driver Header */}
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={group.driver.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.driver.name)}&background=2563eb&color=ffffff&size=32`}
                  alt={group.driver.name}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{group.driver.name}</h4>
                  <p className="text-xs text-gray-500">{group.images.length} image(s) uploaded</p>
                </div>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-4 gap-2">
                {group.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.message || image.description || 'Dispatch image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1">
                      <div className="truncate">
                        {format(new Date(image.uploadedAt.seconds ? image.uploadedAt.seconds * 1000 : image.uploadedAt), 'MMM dd, HH:mm')}
                      </div>
                      {image.message && (
                        <div className="truncate text-yellow-200 font-medium">
                          {image.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {drivers.find(d => d.id === selectedImage.driverId)?.name || 'Unknown Driver'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(selectedImage.uploadedAt.seconds ? selectedImage.uploadedAt.seconds * 1000 : selectedImage.uploadedAt), 'PPpp')}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="ml-4 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2 transition"
                aria-label="Close image modal"
              >
                <FontAwesomeIcon icon={['fas', 'times']} size="lg" />
              </button>
            </div>
            {/* Image */}
            <div className="flex flex-col items-center px-6 py-6">
              <div className="flex justify-center items-center w-full" style={{ minHeight: '240px' }}>
                <div style={{ width: '320px', height: '320px', background: '#f3f4f6', borderRadius: '0.75rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.message || selectedImage.description || 'Dispatch image'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>
              {/* Message/Description Section */}
              {(selectedImage.message || selectedImage.description) && (
                <div className="w-full mt-6">
                  {selectedImage.message && (
                    <div className="mb-3 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start">
                      <FontAwesomeIcon icon="comment-dots" className="text-blue-400 mr-3 mt-1" size="lg" />
                      <div>
                        <div className="text-xs text-blue-700 font-semibold mb-1">Message</div>
                        <div className="text-blue-900 text-base leading-relaxed break-words">{selectedImage.message}</div>
                      </div>
                    </div>
                  )}
                  {selectedImage.description && (
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-start">
                      <FontAwesomeIcon icon="info-circle" className="text-gray-400 mr-3 mt-1" size="lg" />
                      <div>
                        <div className="text-xs text-gray-700 font-semibold mb-1">Description</div>
                        <div className="text-gray-900 text-base leading-relaxed break-words">{selectedImage.description}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DispatchImagesGallery;
