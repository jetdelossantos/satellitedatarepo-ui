export class SatelliteFileData {
    public fileuniqueid: string;
    public filesize: string;
    public filename: string;
    public fileUrl: string;
    public data: string;
    public format: string;
    public uploader: string;
    public downloads: string;
    public created: any;
  
    constructor() {
      this.fileuniqueid = '';
      this.filesize = '';
      this.filename = '';
      this.fileUrl = '';
      this.data = '';
      this.format = '';
      this.uploader = '';
      this.created = null;
    }
  
  }
  