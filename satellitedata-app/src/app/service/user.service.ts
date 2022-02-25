import { Injectable } from '@angular/core';
//added IMPORTS
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CustomHttpResponse } from '../model/custom-http-response';
import { SatelliteFileData } from '../model/satellitefiledata';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private host: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public getUsers(): Observable<User[]>{
    return this.http.get<User[]>(`${this.host}/user/list`);
  } 

  public getFiles(): Observable<SatelliteFileData[]>{
    return this.http.get<SatelliteFileData[]>(`${this.host}/satfile/list`);
  } 

  public addUser(formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.host}/user/add`, formData);
  }

  public updateUser(formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.host}/user/update`, formData);
  }

  public changePassword(formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.host}/user/changepassword`, formData);
  }

  public resetPassword(email: string): Observable<CustomHttpResponse> {
    return this.http.get<CustomHttpResponse>(`${this.host}/user/resetpassword/${email}`);
  }

  public updateProfileImage(formData: FormData): Observable<HttpEvent<User>> {
    return this.http.post<User>(`${this.host}/user/updateProfileImage`, formData,
    {reportProgress: true,
      observe: 'events'
    });
  }

  public deleteUser(username: string): Observable<CustomHttpResponse> {
    return this.http.delete<CustomHttpResponse>(`${this.host}/user/delete/${username}`);
  }

  public addUsersToLocalCache(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  public getUsersFromLocalCache(): User[] {
    if (localStorage.getItem('users')) {
        return JSON.parse(localStorage.getItem('users') || '{}');
    } else {
        return JSON.parse('{}');
    }
  }
  public createChangePasswordFormData(currentusername: string, oldpassword:string, newpassword:string): FormData {
    const formData = new FormData();
    formData.append('currentUsername', currentusername);
    formData.append('oldpassword', oldpassword);
    formData.append('newpassword', newpassword);
    return formData;
  }

  public createUserFormData(loggedInUsername: string, user: User, profileImage: File): FormData {
    const formData = new FormData();
    formData.append('currentUsername', loggedInUsername);
    formData.append('firstname', user.firstname);
    formData.append('lastname', user.lastname);
    formData.append('username', user.username);
    formData.append('email', user.email);
    formData.append('country', user.country);
    formData.append('role', user.role);
    formData.append('profileImage', profileImage);
    formData.append('isactive', JSON.stringify(user.isactive));
    formData.append('isnotlocked', JSON.stringify(user.isnotlocked));
    return formData;
  }
}
