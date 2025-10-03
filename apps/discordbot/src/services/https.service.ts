import { Injectable } from '@nestjs/common';
import { ErrorCode } from '@workspace/constants';
import { ApiError, fetcher } from '@workspace/http';
import type {
  APIGuild,
  APIRole,
  APIUser,
  RESTPatchAPIUserJSON,
  RESTPostAPIGuildJSON,
  RESTPostAPIRoleJSON,
  RESTPostAPIUserJSON,
} from '@workspace/types/api';

@Injectable()
export class HttpsService {
  constructor() {}

  //###########################################################################
  //# API Users Operations
  //###########################################################################

  async fetchApiUser(uid: string): Promise<APIUser | null> {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + `/api/users/${uid}`;
    const response = await fetcher.get<APIUser>(url);
    if (response.ok) return response.data;
    if (response.status === 404) return null;
    throw new ApiError(response);
  }

  async createApiUser(data: RESTPostAPIUserJSON): Promise<APIUser> {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + `/api/users`;
    const response = await fetcher.post<RESTPostAPIUserJSON, APIUser>(url, data);
    if (response.ok) return response.data;
    if (response.code === ErrorCode.AlreadyAccount) {
      return this.fetchApiUser(data.discordId) as Promise<APIUser>;
    }
    throw new ApiError(response);
  }

  async updateApiUser(data: RESTPatchAPIUserJSON) {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + `/api/users/${data.uid}`;
    const response = await fetcher.patch<RESTPatchAPIUserJSON, APIUser>(url, data);
    if (response.ok) return response.data;
    throw new ApiError(response);
  }

  //###########################################################################
  //# API Guilds Operations
  //###########################################################################

  async fetchApiGuild(guildId: string) {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + `/api/guilds/${guildId}`;
    const response = await fetcher.get<APIGuild>(url);
    if (response.ok) return response.data;
    if (response.status === 404) return null;
    throw new ApiError(response);
  }

  async createApiGuild(data: RESTPostAPIGuildJSON) {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + '/api/guilds';
    const response = await fetcher.post<RESTPostAPIGuildJSON, APIGuild>(url, data);
    if (response.ok) return response.data;
    if (response.code === ErrorCode.AlreadyGuild) {
      return this.fetchApiGuild(data.uid) as Promise<APIGuild>;
    }
    throw new ApiError(response);
  }

  //###########################################################################
  //# API Roles Operations
  //###########################################################################

  async fetchApiRole(guildId: string, roleId: string) {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + `/api/guilds/${guildId}/roles/${roleId}`;
    const response = await fetcher.get<APIRole>(url);
    if (response.ok) return response.data;
    if (response.status === 404) return null;
    throw new ApiError(response);
  }

  async createApiRole(guildId: string, data: RESTPostAPIRoleJSON) {
    const url = process.env.CLOUD_RUN_API_SERVICE_URL + `/api/guilds/${guildId}/roles`;
    const response = await fetcher.post<RESTPostAPIRoleJSON, APIRole>(url, data);
    if (response.ok) return response.data;
    if (response.code === ErrorCode.AlreadyRole) {
      return this.fetchApiRole(guildId, data.uid) as Promise<APIRole>;
    }
    throw new ApiError(response);
  }
}
