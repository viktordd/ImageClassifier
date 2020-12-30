import React, { Component } from 'react';
import './ClassifyImage.css';

export class ClassifyImage extends Component {
  static displayName = ClassifyImage.name;

  inputRef;

  constructor(props) {
    super(props);
    this.state = { images: [], error: null };


    this.handleAddPhoto = this.handleAddPhoto.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.handlePhotoLoaded = this.handlePhotoLoaded.bind(this);
  }

  getUniqueId(name) {
    const { images } = this.state;

    var i = 0;
    var id = name;
    var existing = images.find(img => img.id === id);

    while (existing) {
      i += 1;
      id = `${name} (${i})`
      existing = images.find(img => img.id === id);
    }

    return id;
  }

  handleAddPhoto(event) {
    const { images } = this.state;

    const newImages = [];

    for (let i = 0; i < event.target.files.length; i += 1) {
      const file = event.target.files[i];
      const image = {
        id: this.getUniqueId(file.name),
        name: file.name,
        totalSize: file.size,
        loadedSize: 0,
        loading: true,
        fileReader: this.readAndUploadImage(file),
        file
      };
      newImages.push(image);
    }

    const allImages = images.concat(newImages);
    this.setState({ images: allImages });
  }

  readAndUploadImage(file) {
    const fileReader = new FileReader();
    fileReader.onprogress = this.handleProgress;
    fileReader.onload = this.handlePhotoLoaded;
    fileReader.readAsDataURL(file);
    return fileReader;
  }

  handleProgress(event) {
    const { images } = this.state;

    const newImage = images.find(img => img.fileReader === event.target);
    newImage.loadedSize = event.loaded;
    this.setState({ images });
  }

  handlePhotoLoaded(event) {
    const fileReader = event.target;

    const { images } = this.state;

    let updatedImage;
    const updatedImages = images.map(img => img.fileReader === fileReader
      ? updatedImage = { ...img, src: fileReader.result }
      : img);
    this.setState({ images: updatedImages });

    return this.uploadPhoto(updatedImage);
  }

  uploadPhoto(image) {
    const formData = new FormData();
    formData.append('file', image.file);

    return fetch('ImageClassification',
      {
        credentials: 'include',
        method: 'POST',
        body: formData
      })
      .then((result) => {
        if (result.ok) {
          return result.json();
        }
        throw new Error('failed to upload image');
      })
      .then((predictions) => {
        this.setState(state => {
          const { images } = state;

          const updatedImages = images.map(img => img === image
            ? { ...img, predictions, loading: false }
            : img);

          return {
            images: updatedImages,
            error: null,
          };
        });
      })
      .catch(() => {
        this.setState(state => {
          const { images } = state;
          return {
            images: images.filter(img => img !== image),
            error: 'There was a problem uploading your file, please try again.'
          };
        });
      });
  }

  renderImages() {
    const { images } = this.state;
    return (
      <table className='table table-striped image-table'>
        <thead>
          <tr>
            <th>Image</th>
            <th>Probability</th>
          </tr>
        </thead>
        <tbody>
          {images.map(img =>
            <tr key={img.id}>
              <td><img className="photo-image" src={img.src} /></td>
              <td>{
                img.loading
                  ? "Loading..." :
                  this.renderPredictions(img.predictions)
              }</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  renderPredictions(predictions) {
    return predictions
      .map(tag =>
        <div key={tag.tagId}>
          {tag.tagName}:{' '}
          {(Number.parseFloat(tag.probability) * 100).toFixed(1)}%
      </div>
      );
  }


  render() {
    const { error } = this.state;

    return (
      <>
        <input
          type="file"
          accept="image/*"
          className="hide"
          onChange={this.handleAddPhoto}
          value="" // allows upload of same image again (in case of deletion)
          /* eslint-disable-next-line no-return-assign */
          ref={ref => (this.inputRef = ref)}
        />
        <button onClick={() => this.inputRef.click()}>
          Classify Image
        </button>
        {error && <div>{error}</div>}
        {this.renderImages()}
      </>
    );
  }
}
