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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="max-w-4xl max-h-full p-4">
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <div>
                  <h3 className="font-medium">
                    {drivers.find(d => d.id === selectedImage.driverId)?.name || 'Unknown Driver'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedImage.uploadedAt.seconds ? selectedImage.uploadedAt.seconds * 1000 : selectedImage.uploadedAt), 'PPpp')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={['fas', 'times']} />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.message || selectedImage.description || 'Dispatch image'}
                  className="max-w-full max-h-96 mx-auto"
                />
                {selectedImage.message && (
                  <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                    <p className="text-blue-800 font-medium">Message:</p>
                    <p className="text-blue-700">{selectedImage.message}</p>
                  </div>
                )}
                {selectedImage.description && (
                  <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r">
                    <p className="text-gray-800 font-medium">Description:</p>
                    <p className="text-gray-700">{selectedImage.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DispatchImagesGallery;
