import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { UserService } from '../service/user.service';
import { NotificationService } from '../service/notification.service';
import { NotificationType } from '../enum/notification-type.enum';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { CustomHttpResponse } from '../model/custom-http-response';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';
import { FileUploadStatus } from '../model/file-upload.status';
import { Role } from '../enum/role.enum';
import { SatelliteFileData } from '../model/satellitefiledata';
import { SatelliteDataBytes } from '../model/satellitedatabytes';
import { saveAs} from 'file-saver'
import countries from '../files/country.json'


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users: User[];
  public satdatabytes: SatelliteDataBytes[];
  public satellitefiledatas: SatelliteFileData[];
  public user: User;
  public refreshing: boolean;
  public selectedUser: User;
  public fileName: string;
  public profileImage: File;
  private subscriptions: Subscription[] = [];
  public editUser = new User();
  private currentUsername: string;
  public fileStatus = new FileUploadStatus();
  public currentUser = new User();
  public deleteUser = new User();
  public userPage = 1;
  public userPageSize = 10;
  public filePage = 1;
  public filePageSize = 10;
  public bytePage = 1;
  public bytePageSize = 10;
  public deleteFile: SatelliteFileData;
  fileuploadtemp: any;
  toggleupload: boolean;
  satdatabytereportToggle: boolean;
  formgst: string;
  formgst2: string;
  formdatatype: string;
  formformat: string;
  formsensor: string;
  countryList: any = countries;
  gstlock: any;




  constructor(private router: Router, private authenticationService: AuthenticationService,
              private userService: UserService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache();
    this.setGstOfUser(this.user.country);
    this.getUsers(true);
    this.getSatelliteFileDatas(true);
    this.satdatabytes = [];
    this.toggleupload = false;
    this.satdatabytereportToggle = true;
  }
  
  public setGstOfUser(country) {
    this.gstlock = this.countryList[country].countrydetails.gst;
  }
  public downloadData() {
    console.log(this.satdatabytes);
  }

  public resetData() {
    this.satdatabytes = [];
    this.satdatabytereportToggle = true;
    this.formgst = null;
    this.formgst2 = '';
    this.formdatatype = '';
    this.formsensor = '';
    this.formformat = '';

  } 
  public changeTitle(title: string): void {
    this.titleSubject.next(title);
  }

  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response: User[]) => {
          this.userService.addUsersToLocalCache(response);
          this.users = response;
          this.refreshing = false;
          if (showNotification && response != null) {
            this.sendNotification(NotificationType.SUCCESS, `${response.length} user(s) loaded successfully.`);
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        }
      )
    );
  }

  public getSatelliteFileDatas(showNotification: boolean) {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getFiles().subscribe(
        (response: SatelliteFileData[]) => {
            this.satellitefiledatas = response;
            this.refreshing = false;
            if (showNotification) {
              this.sendNotification(NotificationType.SUCCESS, `${response.length} satellite data file(s) loaded successfully.`); 
          }
          
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        }
      )
    );
  }

  public getFileSize(filesize : String) {
    let bytes = Number(filesize);
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    let a: any = Math.floor(Math.log(bytes) / Math.log(1024))
    const i = parseInt(a, 10)
    if (i === 0) return `${bytes} ${sizes[i]}`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
  }

  public onSelectUser(selectedUser: User): void {
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo');
  }

  public onProfileImageChange(fileName: string, profileImage: File): void {
    this.fileName =  fileName;
    this.profileImage = profileImage;
  }

  uploadMode(): void {
    this.toggleupload = !this.toggleupload;
    console.log(this.toggleupload);
  }

  onUploadFile(file): void {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploader', this.user.username);
    this.subscriptions.push(
      this.userService.uploadFile(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportUploadFileProgress(event);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
      }
    )
    );
  }

  reportUploadFileProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total!);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if (event.status === 200) {
          this.sendNotification(NotificationType.SUCCESS, `File uploaded successfully`);
          this.fileStatus.status = 'done';
          this.getSatelliteFileDatas(true);
          this.uploadMode();
          break;
        } else {
          this.sendNotification(NotificationType.ERROR, `Unable to upload fille. Please try again`);
          break;
        }
      default:
        `Finished all processes`;
    }
  }

  onDownloadFile (fileuniqueid: string): void {
    this.subscriptions.push(
      this.userService.downloadFile(fileuniqueid).subscribe(
        (event: HttpEvent<any>) => {
          this.reportDownloadFileProgress(event);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
      }
    )
    );
  }
  reportDownloadFileProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.DownloadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total!);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if (event.status === 200) {
          saveAs(new File([event.body], event.headers.get('File-Name'), {type: `${event.headers.get('Content-Type')};charset=utf-8`}));
          this.sendNotification(NotificationType.SUCCESS, `File downloaded successfully`);
          this.fileStatus.status = 'done';
          break;
        } else {
          this.sendNotification(NotificationType.ERROR, `Unable to download. Please try again`);
          break;
        }
      default:
        `Finished all processes`;
    }
  }

  onDownloadSatBytes(): void {
    const formData = new FormData();
    if (this.formgst2 == null || this.formgst2 == ''){
      formData.append('gst', this.formgst + '%');
    } else {
      formData.append('gst', this.formgst + '\t' + this.formgst2 + '%');
    }
    formData.append('format', this.formformat + '%');
    formData.append('datatype', this.formdatatype + '%');
    formData.append('requester', this.user.username);
    this.subscriptions.push(
      this.userService.downloadSatBytes(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportDownloadSatBytesProgress(event);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
      }
    )
    );
  }
  reportDownloadSatBytesProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.DownloadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total!);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if (event.status === 200) {
          saveAs(new File([event.body], event.headers.get('File-Name'), {type: `${event.headers.get('Content-Type')};charset=utf-8`}));
          this.sendNotification(NotificationType.SUCCESS, `File downloaded successfully`);
          this.fileStatus.status = 'done';
          break;
        } else {
          this.sendNotification(NotificationType.ERROR, `Unable to download. Please try again`);
          break;
        }
      default:
        `Finished all processes`;
    }
  }


  public changePassword(formdata: NgForm): void {
    this.currentUser = this.authenticationService.getUserFromLocalCache();
    this.currentUsername = this.currentUser.username;
    console.log(formdata.value);
    const formData = this.userService.createChangePasswordFormData(this.currentUsername, formdata.value.oldpassword, formdata.value.newpassword);
    this.subscriptions.push(
      this.userService.changePassword(formData).subscribe(
        (response: User) => {
          this.sendNotification(NotificationType.SUCCESS, `Password has been changed for ${response.firstname}.
          You will be logged out now.`);
          this.authenticationService.logOut();
          this.router.navigate(['/login']);
          this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    );
  }

  public getSatBytes(formdata: NgForm) {
    this.formgst = formdata.value.gst;
    this.formgst2 = formdata.value.gst2;
    this.formdatatype = formdata.value.datatype;
    this.formformat = formdata.value.format;
    const formData = new FormData();
    if (this.formgst2 == null || this.formgst2 == ''){
      formData.append('gst', this.formgst + '%');
    } else {
      formData.append('gst', this.formgst + '\t' + this.formgst2 + '%');
    }
    formData.append('datatype', formdata.value.datatype + '%');
    formData.append('format', formdata.value.format + '%');
    this.subscriptions.push(
      this.userService.getBytes(formData).subscribe(
        (response: SatelliteDataBytes[]) => {
          this.satdatabytes= response;
          this.satdatabytereportToggle = false;
          if (response != null){
          this.sendNotification(NotificationType.SUCCESS, `${response.length} Sat Data Bytes(s) loaded successfully.`);
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
    )
    );
  }

  public saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFormData('', userForm.value, this.profileImage!);
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe(
        (response: User) => {
          this.clickButton('new-user-close');
          this.getUsers(false);
          this.fileName = null!;
          this.profileImage = null!;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS, `${response.firstname} ${response.lastname} added successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.profileImage = null!;
        }
      )
      );
  }

  public onUpdateUser(): void {
    const formData = this.userService.createUserFormData(this.currentUsername!, this.editUser, this.profileImage!);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false);
          this.fileName = null!;
          this.profileImage = null!;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstname} ${response.lastname} updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.profileImage = null!;
        }
      )
      );
  }

  public onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFormData(this.currentUsername, user, this.profileImage!);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.authenticationService.addUserToLocalCache(response);
          this.getUsers(false);
          this.fileName = null!;
          this.profileImage = null!;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstname} ${response.lastname} updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
          this.profileImage = null!;
        }
      )
      );
  }

  public onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('profileImage', this.profileImage);
    this.subscriptions.push(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportUploadProgress(event);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
        }
      )
    );
  }

  private reportUploadProgress(event: HttpEvent<any>): void {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total!);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if (event.status === 200) {
          this.user!.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCESS, `${event.body.firstname}\'s profile image updated successfully`);
          this.fileStatus.status = 'done';
          break;
        } else {
          this.sendNotification(NotificationType.ERROR, `Unable to upload image. Please try again`);
          break;
        }
      default:
        `Finished all processes`;
    }
  }

  public updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }

  public onResetPassword(emailForm: NgForm): void {
    this.refreshing = true;
    const emailAddress = emailForm.value['reset-password-email'];
    this.subscriptions.push(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.refreshing = false;
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, error.error.message);
          this.refreshing = false;
        },
        () => emailForm.reset()
      )
    );
  }

  public deleteThisUser(username: string): void {
    this.subscriptions.push(
      this.userService.deleteUser(username).subscribe(
        (response: CustomHttpResponse) => {
          this.clickButton('closeDeleteUserModalButton');
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.getUsers(false);
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
        }
      )
    );
  }

  public deleteThisFile(fileuniqueid: string): void {
    this.subscriptions.push(
      this.userService.deleteFile(fileuniqueid).subscribe(
        (response: CustomHttpResponse) => {
          this.clickButton('closeDeleteFileModalButton');
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.getSatelliteFileDatas(false);
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
        }
      )
    );
  }

  public onEditUser(editUser: User): void {
    this.editUser = editUser;
    this.currentUsername = editUser.username;
    this.clickButton('openUserEdit');
  }

  public onDeleteUser(deleteUser: User): void {
    this.deleteUser = deleteUser;
    this.clickButton('openUserDelete');
  }
  public confirmUpload(file): void {
    this.fileuploadtemp = file;
    this.clickButton('openUserDelete');
  }

  public onDeleteFile(deleteFile: SatelliteFileData): void {
    this.deleteFile = deleteFile;
    this.clickButton('openFileDelete');
  }


  public searchUsers(searchTerm: string): void {
    const results: User[] = [];
    for (const user of this.userService.getUsersFromLocalCache()) {
      if (user.firstname.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
          user.lastname.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
          user.username.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
          user.userid.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
          results.push(user);
      }
    }
    this.users = results;
    if (results.length === 0 || !searchTerm) {
      this.users = this.userService.getUsersFromLocalCache();
    }
  }

  public get isAdmin(): boolean {
    return this.getUserRole() === Role.ADMIN || this.getUserRole() === Role.SUPER_ADMIN;
  }

  public get isManager(): boolean {
    return this.isAdmin || this.getUserRole() === Role.MANAGER;
  }

  public get isAdminOrManager(): boolean {
    return this.isAdmin || this.isManager;
  }

  private getUserRole(): string {
    return this.authenticationService.getUserFromLocalCache().role;
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if (message) {
      this.notificationService.notify(notificationType, message);
    } else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again.');
    }
  }

  public clickButton(buttonId: string): void {
    document.getElementById(buttonId)!.click();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
