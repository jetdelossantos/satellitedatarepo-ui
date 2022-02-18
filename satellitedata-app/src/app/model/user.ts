export class User {
    public userid: string;
    public firstname: string;
    public lastname: string;
    public username: string;
    public email: string;
    public country: string;
    public lastLoginDate: any;
    public lastLoginDateDisplay: any;
    public joinDate: any;
    public profileImageUrl: string;
    public isactive: boolean;
    public isnotlocked: boolean;
    public role: string;
    public authorities: [];
  
    constructor() {
      this.userid = '';
      this.firstname = '';
      this.lastname = '';
      this.username = '';
      this.email = '';
      this.country = '';
      this.lastLoginDate = null;
      this.lastLoginDateDisplay = null;
      this.joinDate = null;
      this.profileImageUrl = '';
      this.isactive = false;
      this.isnotlocked = false;
      this.role = '';
      this.authorities = [];
    }
  
  }
  