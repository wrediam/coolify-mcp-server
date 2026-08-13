# Coolify API Reference

> **Source:** [`openapi.yaml` on `v4.x` branch](https://raw.githubusercontent.com/coollabsio/coolify/v4.x/openapi.yaml)  
> **Verified against:** [`routes/api.php` at `v4.3.1`](https://github.com/coollabsio/coolify/blob/v4.3.1/routes/api.php)  
> **OpenAPI Version:** 3.1.0  
> **API Version:** 0.1  
> **Base URL:** `https://<your-coolify-instance>/api/v1`

---

## Authentication

All endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are scoped to a **single team** and carry specific permissions. Obtain tokens from **Security → API Tokens** in the Coolify dashboard.

Doc: https://coolify.io/docs/api-reference/authorization

---

## Table of Contents

- [General](#general)
- [Applications](#applications)
- [Databases](#databases)
- [Services](#services)
- [Servers](#servers)
- [Projects](#projects)
- [Teams](#teams)
- [Deployments](#deployments)
- [Private Keys](#private-keys)
- [Scheduled Tasks](#scheduled-tasks)
- [GitHub Apps](#github-apps)
- [Cloud Tokens](#cloud-tokens)
- [Hetzner](#hetzner)
- [Resources](#resources)
- [Error Responses](#error-responses)

---

## General

### `GET /version`
**operationId:** `version`  
**Summary:** Get Coolify version.  
**Auth:** Bearer token required  
**Response 200:** `text/html` — e.g. `v4.0.0`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/version

---

### `POST /enable`
**operationId:** `enable-api`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Enable API (root permissions only).  
**Auth:** Bearer token required  
**Response 200:** `{ "message": "API enabled." }`  
**Response 403:** Not allowed  
**Doc:** https://coolify.io/docs/api-reference/api/operations/enable-api

---

### `POST /disable`
**operationId:** `disable-api`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Disable API (root permissions only).  
**Auth:** Bearer token required  
**Response 200:** `{ "message": "API disabled." }`  
**Response 403:** Not allowed  
**Doc:** https://coolify.io/docs/api-reference/api/operations/disable-api

---

### `GET /health`
**operationId:** `healthcheck`  
**Summary:** Healthcheck endpoint.  
**Auth:** Not required  
**Response 200:** `text/html` — `OK`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/healthcheck

---

### `POST /mcp/enable`
**operationId:** `enable-mcp`  
**Summary:** Enable MCP Server endpoint at `/mcp` (root permissions only).  
**Auth:** Bearer token required  
**Response 200:** `{ "message": "MCP server enabled." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/enable-mcp

---

### `POST /mcp/disable`
**operationId:** `disable-mcp`  
**Summary:** Disable MCP Server endpoint at `/mcp` (root permissions only).  
**Auth:** Bearer token required  
**Response 200:** `{ "message": "MCP server disabled." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/disable-mcp

---

## Applications

### `GET /applications`
**operationId:** `list-applications`  
**Summary:** List all applications.  
**Query Params:**
- `tag` (string, optional) — Filter by tag name  
**Response 200:** Array of `Application` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-applications

---

### `POST /applications/public`
**operationId:** `create-public-application`  
**Summary:** Create application from a public git repository.  
**Required Body Fields:** `project_uuid`, `server_uuid`, `environment_name` or `environment_uuid`, `git_repository`, `git_branch`, `build_pack` (`nixpacks`|`railpack`|`static`|`dockerfile`|`dockercompose`), `ports_exposes`  
**Optional Fields:** `name`, `description`, `domains`, `destination_uuid`, `git_commit_sha`, `docker_registry_image_name`, `docker_registry_image_tag`, `is_static`, `is_spa`, `is_auto_deploy_enabled`, `is_force_https_enabled`, `static_image`, `install_command`, `build_command`, `start_command`, `ports_mappings`, `base_directory`, `publish_directory`, `health_check_*`, `limits_*`, `custom_labels`, `custom_docker_run_options`, `post_deployment_command`, `post_deployment_command_container`, `pre_deployment_command`, `pre_deployment_command_container`, `manual_webhook_secret_github`, `manual_webhook_secret_gitlab`, `manual_webhook_secret_bitbucket`, `manual_webhook_secret_gitea`, `redirect` (`www`|`non-www`|`both`), `instant_deploy`, `dockerfile`, `dockerfile_location`, `docker_compose_location`, `docker_compose_custom_start_command`, `docker_compose_custom_build_command`, `docker_compose_domains`, `watch_paths`, `use_build_server`, `is_http_basic_auth_enabled`, `http_basic_auth_username`, `http_basic_auth_password`, `connect_to_docker_network`, `force_domain_override`, `autogenerate_domain`, `is_container_label_escape_enabled`, `is_preserve_repository_enabled`  
**Response 201:** `{ "uuid": string }`  
**Response 409:** Domain conflicts detected  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-public-application

---

### `POST /applications/private-github-app`
**operationId:** `create-private-github-app-application`  
**Summary:** Create application from a private repo via GitHub App.  
**Required Body Fields:** `project_uuid`, `server_uuid`, `environment_name` or `environment_uuid`, `github_app_uuid`, `git_repository`, `git_branch`, `build_pack`, `ports_exposes`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-private-github-app-application

---

### `POST /applications/private-deploy-key`
**operationId:** `create-private-deploy-key-application`  
**Summary:** Create application from a private repo via Deploy Key.  
**Required Body Fields:** `project_uuid`, `server_uuid`, `environment_name` or `environment_uuid`, `private_key_uuid`, `git_repository`, `git_branch`, `build_pack`, `ports_exposes`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-private-deploy-key-application

---

### `POST /applications/dockerfile`
**operationId:** `create-dockerfile-application`  
**Summary:** Create application from a Dockerfile (no git).  
**Required Body Fields:** `project_uuid`, `server_uuid`, `environment_name` or `environment_uuid`, `dockerfile`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-dockerfile-application

---

### `POST /applications/dockerimage`
**operationId:** `create-dockerimage-application`  
**Summary:** Create application from a prebuilt Docker image (no git).  
**Required Body Fields:** `project_uuid`, `server_uuid`, `environment_name` or `environment_uuid`, `docker_registry_image_name`, `ports_exposes`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-dockerimage-application

---

### `GET /applications/{uuid}`
**operationId:** `get-application-by-uuid`  
**Summary:** Get application by UUID.  
**Path Params:** `uuid`  
**Response 200:** `Application` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-application-by-uuid

---

### `PATCH /applications/{uuid}`
**operationId:** `update-application-by-uuid`  
**Summary:** Update application by UUID.  
**Path Params:** `uuid`  
**Body:** Any updateable application fields  
**Response 200:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-application-by-uuid

---

### `DELETE /applications/{uuid}`
**operationId:** `delete-application-by-uuid`  
**Summary:** Delete application by UUID.  
**Path Params:** `uuid`  
**Query Params:** `delete_configurations` (bool, default true), `delete_volumes` (bool, default true), `docker_cleanup` (bool, default true), `delete_connected_networks` (bool, default true)  
**Response 200:** `{ "message": "Application deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-application-by-uuid

---

### `GET /applications/{uuid}/logs`
**operationId:** `get-application-logs-by-uuid`  
**Summary:** Get application logs.  
**Path Params:** `uuid`  
**Query Params:** `lines` (int, default 100)  
**Response 200:** `{ "logs": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-application-logs-by-uuid

---

### `POST /applications/{uuid}/start`
**operationId:** `start-application-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Start application.  
**Path Params:** `uuid`  
**Body Params:** `force` (bool, default false), `instant_deploy` (bool, default false)  
**Response 200:** `{ "message": "Deployment request queued.", "deployment_uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/start-application-by-uuid

---

### `POST /applications/{uuid}/stop`
**operationId:** `stop-application-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Stop application.  
**Path Params:** `uuid`  
**Body Params:** `docker_cleanup` (bool, default true)  
**Response 200:** `{ "message": "Application stopping request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/stop-application-by-uuid

---

### `POST /applications/{uuid}/restart`
**operationId:** `restart-application-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Restart application.  
**Path Params:** `uuid`  
**Response 200:** `{ "message": "Restart request queued.", "deployment_uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/restart-application-by-uuid

---

### `GET /applications/{uuid}/envs`
**operationId:** `list-envs-by-application-uuid`  
**Summary:** List all environment variables for an application.  
**Response 200:** Array of `EnvironmentVariable`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-envs-by-application-uuid

---

### `POST /applications/{uuid}/envs`
**operationId:** `create-env-by-application-uuid`  
**Summary:** Create environment variable for an application.  
**Body:** `key`, `value`, `is_preview`, `is_literal`, `is_multiline`, `is_shown_once`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-env-by-application-uuid

---

### `PATCH /applications/{uuid}/envs`
**operationId:** `update-env-by-application-uuid`  
**Summary:** Update environment variable for an application.  
**Body:** `key` (required), `value` (required), `is_preview`, `is_literal`, `is_multiline`, `is_shown_once`  
**Response 201:** `EnvironmentVariable`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-env-by-application-uuid

---

### `PATCH /applications/{uuid}/envs/bulk`
**operationId:** `update-envs-by-application-uuid`  
**Summary:** Bulk update environment variables for an application.  
**Body:** `{ "data": [{ key, value, is_preview, is_literal, is_multiline, is_shown_once }] }`  
**Response 201:** Array of `EnvironmentVariable`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-envs-by-application-uuid

---

### `DELETE /applications/{uuid}/envs/{env_uuid}`
**operationId:** `delete-env-by-application-uuid`  
**Summary:** Delete environment variable by UUID.  
**Response 200:** `{ "message": "Environment variable deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-env-by-application-uuid

---

### `GET /applications/{uuid}/storages`
**operationId:** `list-storages-by-application-uuid`  
**Summary:** List all persistent and file storages for an application.  
**Response 200:** `{ "persistent_storages": [...], "file_storages": [...] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-storages-by-application-uuid

---

### `POST /applications/{uuid}/storages`
**operationId:** `create-storage-by-application-uuid`  
**Summary:** Create a storage for an application.  
**Required Body:** `type` (`persistent`|`file`), `mount_path`  
**Optional Body:** `name`, `host_path`, `content`, `is_directory`, `fs_path`  
**Response 201:** Storage object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-storage-by-application-uuid

---

### `PATCH /applications/{uuid}/storages`
**operationId:** `update-storage-by-application-uuid`  
**Summary:** Update a storage for an application.  
**Required Body:** `type`  
**Optional Body:** `uuid`, `id`, `is_preview_suffix_enabled`, `name`, `mount_path`, `host_path`, `content`  
**Response 200:** Storage object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-storage-by-application-uuid

---

### `DELETE /applications/{uuid}/storages/{storage_uuid}`
**operationId:** `delete-storage-by-application-uuid`  
**Summary:** Delete a storage for an application.  
**Response 200:** `{ "message": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-storage-by-application-uuid

---

### `DELETE /applications/{uuid}/previews/{pull_request_id}`
**operationId:** `delete-preview-deployment-by-pull-request-id`  
**Summary:** Delete a preview deployment by PR ID.  
**Response 200:** `{ "message": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-preview-deployment-by-pull-request-id

---

## Databases

### `GET /databases`
**operationId:** `list-databases`  
**Summary:** List all databases.  
**Response 200:** Array of database objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-databases

---

### `GET /databases/{uuid}`
**operationId:** `get-database-by-uuid`  
**Summary:** Get database by UUID.  
**Response 200:** Database object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-database-by-uuid

---

### `PATCH /databases/{uuid}`
**operationId:** `update-database-by-uuid`  
**Summary:** Update database by UUID.  
**Body:** `name`, `description`, `image`, `is_public`, `public_port`, `public_port_timeout`, `limits_*`, plus db-specific fields (`postgres_*`, `mysql_*`, `mariadb_*`, `mongo_*`, `redis_*`, `keydb_*`, `clickhouse_*`, `dragonfly_*`)  
**Response 200:** Database updated  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-database-by-uuid

---

### `DELETE /databases/{uuid}`
**operationId:** `delete-database-by-uuid`  
**Summary:** Delete database by UUID.  
**Query Params:** `delete_configurations`, `delete_volumes`, `docker_cleanup`, `delete_connected_networks`  
**Response 200:** `{ "message": "Database deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-database-by-uuid

---

### `POST /databases/postgresql`
**operationId:** `create-database-postgresql`  
**Summary:** Create a PostgreSQL database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `postgres_user`, `postgres_password`, `postgres_db`, `postgres_initdb_args`, `postgres_host_auth_method`, `postgres_conf`, `destination_uuid`, `name`, `description`, `image`, `is_public`, `public_port`, `public_port_timeout`, `limits_*`, `instant_deploy`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-postgresql

---

### `POST /databases/mysql`
**operationId:** `create-database-mysql`  
**Summary:** Create a MySQL database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `mysql_root_password`, `mysql_password`, `mysql_user`, `mysql_database`, `mysql_conf`, `destination_uuid`, `name`, `description`, `image`, `is_public`, `public_port`, `public_port_timeout`, `limits_*`, `instant_deploy`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-mysql

---

### `POST /databases/mariadb`
**operationId:** `create-database-mariadb`  
**Summary:** Create a MariaDB database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `mariadb_conf`, `mariadb_root_password`, `mariadb_user`, `mariadb_password`, `mariadb_database`, plus common fields  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-mariadb

---

### `POST /databases/mongodb`
**operationId:** `create-database-mongodb`  
**Summary:** Create a MongoDB database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `mongo_conf`, `mongo_initdb_root_username`, plus common fields  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-mongodb

---

### `POST /databases/redis`
**operationId:** `create-database-redis`  
**Summary:** Create a Redis database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `redis_password`, `redis_conf`, plus common fields  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-redis

---

### `POST /databases/keydb`
**operationId:** `create-database-keydb`  
**Summary:** Create a KeyDB database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `keydb_password`, `keydb_conf`, plus common fields  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-keydb

---

### `POST /databases/dragonfly`
**operationId:** `create-database-dragonfly`  
**Summary:** Create a DragonFly database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `dragonfly_password`, plus common fields  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-dragonfly

---

### `POST /databases/clickhouse`
**operationId:** `create-database-clickhouse`  
**Summary:** Create a Clickhouse database.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `clickhouse_admin_user`, `clickhouse_admin_password`, plus common fields  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-clickhouse

---

### `POST /databases/{uuid}/start`
**operationId:** `start-database-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Start database.  
**Response 200:** `{ "message": "Database starting request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/start-database-by-uuid

---

### `POST /databases/{uuid}/stop`
**operationId:** `stop-database-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Stop database.  
**Body Params:** `docker_cleanup` (bool, default true)  
**Response 200:** `{ "message": "Database stopping request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/stop-database-by-uuid

---

### `POST /databases/{uuid}/restart`
**operationId:** `restart-database-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Restart database.  
**Response 200:** `{ "message": "Database restarting request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/restart-database-by-uuid

---

### `GET /databases/{uuid}/backups`
**operationId:** `get-database-backups-by-uuid`  
**Summary:** Get backup details for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-database-backups-by-uuid

---

### `POST /databases/{uuid}/backups`
**operationId:** `create-database-backup`  
**Summary:** Create a scheduled backup configuration.  
**Required Body:** `frequency` (cron expression or: `every_minute`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`)  
**Optional Body:** `enabled`, `save_s3`, `s3_storage_uuid`, `databases_to_backup`, `dump_all`, `backup_now`, `database_backup_retention_amount_locally`, `database_backup_retention_days_locally`, `database_backup_retention_max_storage_locally`, `database_backup_retention_amount_s3`, `database_backup_retention_days_s3`, `database_backup_retention_max_storage_s3`, `timeout`  
**Response 201:** `{ "uuid": string, "message": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-database-backup

---

### `PATCH /databases/{uuid}/backups/{scheduled_backup_uuid}`
**operationId:** `update-database-backup`  
**Summary:** Update a backup configuration.  
**Body:** `save_s3`, `s3_storage_uuid`, `backup_now`, `enabled`, `databases_to_backup`, `dump_all`, `frequency`, retention fields, `timeout`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-database-backup

---

### `DELETE /databases/{uuid}/backups/{scheduled_backup_uuid}`
**operationId:** `delete-backup-configuration-by-uuid`  
**Summary:** Delete a backup configuration and all its executions.  
**Query Params:** `delete_s3` (bool, default false)  
**Response 200:** `{ "message": "Backup configuration and all executions deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-backup-configuration-by-uuid

---

### `GET /databases/{uuid}/backups/{scheduled_backup_uuid}/executions`
**operationId:** `list-backup-executions`  
**Summary:** List all executions for a backup configuration.  
**Response 200:** `{ "executions": [{ uuid, filename, size, created_at, message, status }] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-backup-executions

---

### `DELETE /databases/{uuid}/backups/{scheduled_backup_uuid}/executions/{execution_uuid}`
**operationId:** `delete-backup-execution-by-uuid`  
**Summary:** Delete a specific backup execution.  
**Query Params:** `delete_s3` (bool, default false)  
**Response 200:** `{ "message": "Backup execution deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-backup-execution-by-uuid

---

### `GET /databases/{uuid}/envs`
**operationId:** `list-envs-by-database-uuid`  
**Summary:** List all environment variables for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-envs-by-database-uuid

---

### `POST /databases/{uuid}/envs`
**operationId:** `create-env-by-database-uuid`  
**Summary:** Create environment variable for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-env-by-database-uuid

---

### `PATCH /databases/{uuid}/envs`
**operationId:** `update-env-by-database-uuid`  
**Summary:** Update environment variable for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-env-by-database-uuid

---

### `PATCH /databases/{uuid}/envs/bulk`
**operationId:** `update-envs-by-database-uuid`  
**Summary:** Bulk update environment variables for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-envs-by-database-uuid

---

### `DELETE /databases/{uuid}/envs/{env_uuid}`
**operationId:** `delete-env-by-database-uuid`  
**Summary:** Delete environment variable for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-env-by-database-uuid

---

### `GET /databases/{uuid}/storages`
**operationId:** `list-storages-by-database-uuid`  
**Summary:** List all storages for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-storages-by-database-uuid

---

### `POST /databases/{uuid}/storages`
**operationId:** `create-storage-by-database-uuid`  
**Summary:** Create a storage for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-storage-by-database-uuid

---

### `PATCH /databases/{uuid}/storages`
**operationId:** `update-storage-by-database-uuid`  
**Summary:** Update a storage for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-storage-by-database-uuid

---

### `DELETE /databases/{uuid}/storages/{storage_uuid}`
**operationId:** `delete-storage-by-database-uuid`  
**Summary:** Delete a storage for a database.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-storage-by-database-uuid

---

## Services

### `GET /services`
**operationId:** `list-services`  
**Summary:** List all services.  
**Response 200:** Array of `Service` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-services

---

### `POST /services`
**operationId:** `create-service`  
**Summary:** Create a one-click or custom service.  
**Required Body:** `server_uuid`, `project_uuid`, `environment_name` or `environment_uuid`  
**Optional Body:** `type` (one-click service type, e.g. `actualbudget`, `gitea-with-mysql`...), `name`, `description`, `destination_uuid`, `instant_deploy`, `docker_compose_raw` (base64 encoded), `urls`, `force_domain_override`, `is_container_label_escape_enabled`  
**Response 201:** `{ "uuid": string, "domains": [...] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-service

---

### `GET /services/{uuid}`
**operationId:** `get-service-by-uuid`  
**Summary:** Get service by UUID.  
**Response 200:** `Service` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-service-by-uuid

---

### `PATCH /services/{uuid}`
**operationId:** `update-service-by-uuid`  
**Summary:** Update service by UUID.  
**Body:** `name`, `description`, `project_uuid`, `environment_name`, `environment_uuid`, `server_uuid`, `destination_uuid`, `instant_deploy`, `connect_to_docker_network`, `docker_compose_raw` (base64), `urls`, `force_domain_override`, `is_container_label_escape_enabled`  
**Response 200:** `{ "uuid": string, "domains": [...] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-service-by-uuid

---

### `DELETE /services/{uuid}`
**operationId:** `delete-service-by-uuid`  
**Summary:** Delete service by UUID.  
**Query Params:** `delete_configurations` (bool, default true), `delete_volumes` (bool, default true), `docker_cleanup` (bool, default true), `delete_connected_networks` (bool, default true)  
**Response 200:** `{ "message": "Service deletion request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-service-by-uuid

---

### `POST /services/{uuid}/start`
**operationId:** `start-service-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Start service.  
**Response 200:** `{ "message": "Service starting request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/start-service-by-uuid

---

### `POST /services/{uuid}/stop`
**operationId:** `stop-service-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Stop service.  
**Body Params:** `docker_cleanup` (bool, default true)  
**Response 200:** `{ "message": "Service stopping request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/stop-service-by-uuid

---

### `POST /services/{uuid}/restart`
**operationId:** `restart-service-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Restart service.  
**Body Params:** `latest` (bool, default false — pull latest images)  
**Response 200:** `{ "message": "Service restarting request queued." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/restart-service-by-uuid

---

### `GET /services/{uuid}/envs`
**operationId:** `list-envs-by-service-uuid`  
**Summary:** List all environment variables for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-envs-by-service-uuid

---

### `POST /services/{uuid}/envs`
**operationId:** `create-env-by-service-uuid`  
**Summary:** Create environment variable for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-env-by-service-uuid

---

### `PATCH /services/{uuid}/envs`
**operationId:** `update-env-by-service-uuid`  
**Summary:** Update environment variable for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-env-by-service-uuid

---

### `PATCH /services/{uuid}/envs/bulk`
**operationId:** `update-envs-by-service-uuid`  
**Summary:** Bulk update environment variables for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-envs-by-service-uuid

---

### `DELETE /services/{uuid}/envs/{env_uuid}`
**operationId:** `delete-env-by-service-uuid`  
**Summary:** Delete environment variable for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-env-by-service-uuid

---

### `GET /services/{uuid}/storages`
**operationId:** `list-storages-by-service-uuid`  
**Summary:** List all storages for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-storages-by-service-uuid

---

### `POST /services/{uuid}/storages`
**operationId:** `create-storage-by-service-uuid`  
**Summary:** Create a storage for a service sub-resource.  
**Required Body:** `type`, `mount_path`, `resource_uuid`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-storage-by-service-uuid

---

### `PATCH /services/{uuid}/storages`
**operationId:** `update-storage-by-service-uuid`  
**Summary:** Update a storage for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-storage-by-service-uuid

---

### `DELETE /services/{uuid}/storages/{storage_uuid}`
**operationId:** `delete-storage-by-service-uuid`  
**Summary:** Delete a storage for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-storage-by-service-uuid

---

## Servers

### `GET /servers`
**operationId:** `list-servers`  
**Summary:** List all servers.  
**Response 200:** Array of `Server` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-servers

---

### `POST /servers`
**operationId:** `create-server`  
**Summary:** Create a server.  
**Body:** `name`, `description`, `ip`, `port`, `user`, `private_key_uuid`, `is_build_server`, `instant_validate`, `proxy_type` (`traefik`|`caddy`|`none`)  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-server

---

### `GET /servers/{uuid}`
**operationId:** `get-server-by-uuid`  
**Summary:** Get server by UUID.  
**Response 200:** `Server` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-server-by-uuid

---

### `PATCH /servers/{uuid}`
**operationId:** `update-server-by-uuid`  
**Summary:** Update server by UUID.  
**Body:** `name`, `description`, `ip`, `port`, `user`, `private_key_uuid`, `is_build_server`, `instant_validate`, `proxy_type`, `concurrent_builds`, `dynamic_timeout`, `deployment_queue_limit`, `server_disk_usage_notification_threshold`, `server_disk_usage_check_frequency`, `connection_timeout`  
**Response 201:** `Server` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-server-by-uuid

---

### `DELETE /servers/{uuid}`
**operationId:** `delete-server-by-uuid`  
**Summary:** Delete server by UUID.  
**Response 200:** `{ "message": "Server deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-server-by-uuid

---

### `POST /servers/{uuid}/validate`
**operationId:** `validate-server-by-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Validate server by UUID.  
**Path Params:** `uuid`  
**Body Params:** `install` (bool, default false — also install Coolify prerequisites)  
**Response 201:** `{ "message": "Validation started." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/validate-server-by-uuid

---

### `GET /servers/{uuid}/resources`
**operationId:** `get-resources-by-server-uuid`  
**Summary:** Get all resources on a server.  
**Response 200:** Array of `{ id, uuid, name, type, created_at, updated_at, status }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-resources-by-server-uuid

---

### `GET /servers/{uuid}/domains`
**operationId:** `get-domains-by-server-uuid`  
**Summary:** Get all domains on a server.  
**Response 200:** Array of `{ ip, domains: string[] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-domains-by-server-uuid

---

### `POST /servers/hetzner`
**operationId:** `create-hetzner-server`  
**Summary:** Create a Hetzner server and register it in Coolify.  
**Required Body:** `location`, `server_type`, `image`, `private_key_uuid`  
**Optional Body:** `cloud_provider_token_uuid`, `name`, `enable_ipv4`, `enable_ipv6`, `hetzner_ssh_key_ids`, `cloud_init_script`, `instant_validate`  
**Response 201:** `{ "uuid": string, "hetzner_server_id": int, "ip": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-hetzner-server

---

## Projects

### `GET /projects`
**operationId:** `list-projects`  
**Summary:** List all projects.  
**Response 200:** Array of `Project` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-projects

---

### `POST /projects`
**operationId:** `create-project`  
**Summary:** Create a project.  
**Body:** `name`, `description`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-project

---

### `GET /projects/{uuid}`
**operationId:** `get-project-by-uuid`  
**Summary:** Get project by UUID.  
**Response 200:** `Project` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-project-by-uuid

---

### `PATCH /projects/{uuid}`
**operationId:** `update-project-by-uuid`  
**Summary:** Update project by UUID.  
**Body:** `name`, `description`  
**Response 201:** `{ "uuid": string, "name": string, "description": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-project-by-uuid

---

### `DELETE /projects/{uuid}`
**operationId:** `delete-project-by-uuid`  
**Summary:** Delete project by UUID.  
**Response 200:** `{ "message": "Project deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-project-by-uuid

---

### `GET /projects/{uuid}/{environment_name_or_uuid}`
**operationId:** `get-environment-by-name-or-uuid`  
**Summary:** Get environment by name or UUID.  
**Response 200:** `Environment` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-environment-by-name-or-uuid

---

### `GET /projects/{uuid}/environments`
**operationId:** `get-environments`  
**Summary:** List all environments in a project.  
**Response 200:** Array of `Environment` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-environments

---

### `POST /projects/{uuid}/environments`
**operationId:** `create-environment`  
**Summary:** Create an environment in a project.  
**Body:** `name`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-environment

---

### `DELETE /projects/{uuid}/environments/{environment_name_or_uuid}`
**operationId:** `delete-environment`  
**Summary:** Delete environment (must be empty).  
**Response 200:** `{ "message": "Environment deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-environment

---

## Teams

### `GET /teams`
**operationId:** `list-teams`  
**Summary:** Get all teams.  
**Response 200:** Array of `Team` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-teams

---

### `GET /teams/{id}`
**operationId:** `get-team-by-id`  
**Summary:** Get team by ID.  
**Path Params:** `id` (integer)  
**Response 200:** `Team` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-team-by-id

---

### `GET /teams/{id}/members`
**operationId:** `get-members-by-team-id`  
**Summary:** Get members of a team.  
**Path Params:** `id` (integer)  
**Response 200:** Array of `User` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-members-by-team-id

---

### `GET /teams/current`
**operationId:** `get-current-team`  
**Summary:** Get the currently authenticated team.  
**Response 200:** `Team` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-current-team

---

### `GET /teams/current/members`
**operationId:** `get-current-team-members`  
**Summary:** Get members of the currently authenticated team.  
**Response 200:** Array of `User` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-current-team-members

---

## Deployments

### `GET /deployments`
**operationId:** `list-deployments`  
**Summary:** List currently running deployments.  
**Response 200:** Array of `ApplicationDeploymentQueue` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-deployments

---

### `GET /deployments/{uuid}`
**operationId:** `get-deployment-by-uuid`  
**Summary:** Get deployment by UUID.  
**Response 200:** `ApplicationDeploymentQueue` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-deployment-by-uuid

---

### `POST /deployments/{uuid}/cancel`
**operationId:** `cancel-deployment-by-uuid`  
**Summary:** Cancel a deployment by UUID.  
**Response 200:** `{ "message": string, "deployment_uuid": string, "status": string }`  
**Response 400:** Deployment cannot be cancelled (already finished/failed/cancelled)  
**Doc:** https://coolify.io/docs/api-reference/api/operations/cancel-deployment-by-uuid

---

### `GET /deployments/applications/{uuid}`
**operationId:** `list-deployments-by-app-uuid`  
**Summary:** List deployments for a specific application.  
**Path Params:** `uuid`  
**Query Params:** `skip` (int, default 0), `take` (int, default 10)  
**Response 200:** Array of deployment objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-deployments-by-app-uuid

---

### `POST /deploy`
**operationId:** `deploy-by-tag-or-uuid`  
**Method:** POST only since Coolify v4.2.0.  
**Summary:** Deploy by tag or UUID.  
**Body Params:** `tag` (string, comma-separated), `uuid` (string, comma-separated), `force` (bool), `pr` (int — PR id), `pull_request_id` (int), `docker_tag` (string)  
**Response 200:** `{ "deployments": [{ message, resource_uuid, deployment_uuid }] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/deploy-by-tag-or-uuid

---

## Private Keys

### `GET /security/keys`
**operationId:** `list-private-keys`  
**Summary:** List all private keys.  
**Response 200:** Array of `PrivateKey` objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-private-keys

---

### `POST /security/keys`
**operationId:** `create-private-key`  
**Summary:** Create a private key.  
**Required Body:** `private_key`  
**Optional Body:** `name`, `description`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-private-key

---

### `PATCH /security/keys/{uuid}`
**operationId:** `update-private-key`  
**Summary:** Update a private key.  
**Path Params:** `uuid`  
**Required Body:** `private_key`  
**Optional Body:** `name`, `description`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-private-key

---

### `GET /security/keys/{uuid}`
**operationId:** `get-private-key-by-uuid`  
**Summary:** Get a private key by UUID.  
**Response 200:** `PrivateKey` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-private-key-by-uuid

---

### `DELETE /security/keys/{uuid}`
**operationId:** `delete-private-key-by-uuid`  
**Summary:** Delete a private key.  
**Response 200:** `{ "message": "Private Key deleted." }`  
**Response 422:** Key is in use and cannot be deleted  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-private-key-by-uuid

---

## Scheduled Tasks

### `GET /applications/{uuid}/scheduled-tasks`
**operationId:** `list-scheduled-tasks-by-application-uuid`  
**Summary:** List all scheduled tasks for an application.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-scheduled-tasks-by-application-uuid

---

### `POST /applications/{uuid}/scheduled-tasks`
**operationId:** `create-scheduled-task-by-application-uuid`  
**Summary:** Create a scheduled task for an application.  
**Required Body:** `name`, `command`, `frequency`  
**Optional Body:** `container`, `timeout` (default 300s), `enabled` (default true)  
**Response 201:** `ScheduledTask` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-scheduled-task-by-application-uuid

---

### `PATCH /applications/{uuid}/scheduled-tasks/{task_uuid}`
**operationId:** `update-scheduled-task-by-application-uuid`  
**Summary:** Update a scheduled task for an application.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-scheduled-task-by-application-uuid

---

### `DELETE /applications/{uuid}/scheduled-tasks/{task_uuid}`
**operationId:** `delete-scheduled-task-by-application-uuid`  
**Summary:** Delete a scheduled task for an application.  
**Response 200:** `{ "message": "Scheduled task deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-scheduled-task-by-application-uuid

---

### `GET /applications/{uuid}/scheduled-tasks/{task_uuid}/executions`
**operationId:** `list-scheduled-task-executions-by-application-uuid`  
**Summary:** List all executions for a scheduled task on an application.  
**Response 200:** Array of `ScheduledTaskExecution`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-scheduled-task-executions-by-application-uuid

---

### `GET /services/{uuid}/scheduled-tasks`
**operationId:** `list-scheduled-tasks-by-service-uuid`  
**Summary:** List all scheduled tasks for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-scheduled-tasks-by-service-uuid

---

### `POST /services/{uuid}/scheduled-tasks`
**operationId:** `create-scheduled-task-by-service-uuid`  
**Summary:** Create a scheduled task for a service.  
**Required Body:** `name`, `command`, `frequency`  
**Optional Body:** `container`, `timeout`, `enabled`  
**Response 201:** `ScheduledTask` object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-scheduled-task-by-service-uuid

---

### `PATCH /services/{uuid}/scheduled-tasks/{task_uuid}`
**operationId:** `update-scheduled-task-by-service-uuid`  
**Summary:** Update a scheduled task for a service.  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-scheduled-task-by-service-uuid

---

### `DELETE /services/{uuid}/scheduled-tasks/{task_uuid}`
**operationId:** `delete-scheduled-task-by-service-uuid`  
**Summary:** Delete a scheduled task for a service.  
**Response 200:** `{ "message": "Scheduled task deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-scheduled-task-by-service-uuid

---

### `GET /services/{uuid}/scheduled-tasks/{task_uuid}/executions`
**operationId:** `list-scheduled-task-executions-by-service-uuid`  
**Summary:** List all executions for a scheduled task on a service.  
**Response 200:** Array of `ScheduledTaskExecution`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-scheduled-task-executions-by-service-uuid

---

## GitHub Apps

### `GET /github-apps`
**operationId:** `list-github-apps`  
**Summary:** List all GitHub Apps.  
**Response 200:** Array of GitHub App objects  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-github-apps

---

### `POST /github-apps`
**operationId:** `create-github-app`  
**Summary:** Create a new GitHub App.  
**Required Body:** `name`, `api_url`, `html_url`, `app_id`, `installation_id`, `client_id`, `client_secret`, `private_key_uuid`  
**Optional Body:** `organization`, `custom_user`, `custom_port`, `webhook_secret`, `is_system_wide`  
**Response 201:** `{ id, uuid, name, ... }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-github-app

---

### `PATCH /github-apps/{github_app_id}`
**operationId:** `updateGithubApp`  
**Summary:** Update an existing GitHub App.  
**Path Params:** `github_app_id` (integer)  
**Body:** `name`, `organization`, `api_url`, `html_url`, `custom_user`, `custom_port`, `app_id`, `installation_id`, `client_id`, `client_secret`, `webhook_secret`, `private_key_uuid`, `is_system_wide`  
**Response 200:** `{ "message": string, "data": object }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/updateGithubApp

---

### `DELETE /github-apps/{github_app_id}`
**operationId:** `deleteGithubApp`  
**Summary:** Delete a GitHub App (only if not in use by any applications).  
**Path Params:** `github_app_id` (integer)  
**Response 200:** `{ "message": "GitHub app deleted successfully" }`  
**Response 409:** App is in use  
**Doc:** https://coolify.io/docs/api-reference/api/operations/deleteGithubApp

---

### `GET /github-apps/{github_app_id}/repositories`
**operationId:** `load-repositories`  
**Summary:** Load repositories for a GitHub App.  
**Path Params:** `github_app_id` (integer)  
**Response 200:** `{ "repositories": [...] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/load-repositories

---

### `GET /github-apps/{github_app_id}/repositories/{owner}/{repo}/branches`
**operationId:** `load-branches`  
**Summary:** Load branches for a GitHub repository.  
**Path Params:** `github_app_id`, `owner`, `repo`  
**Response 200:** `{ "branches": [...] }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/load-branches

---

## Cloud Tokens

### `GET /cloud-tokens`
**operationId:** `list-cloud-tokens`  
**Summary:** List all cloud provider tokens.  
**Response 200:** Array of `{ uuid, name, provider, team_id, servers_count, created_at, updated_at }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-cloud-tokens

---

### `POST /cloud-tokens`
**operationId:** `create-cloud-token`  
**Summary:** Create a cloud provider token. Token is validated before storing.  
**Required Body:** `provider` (`hetzner`|`digitalocean`), `token`, `name`  
**Response 201:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/create-cloud-token

---

### `GET /cloud-tokens/{uuid}`
**operationId:** `get-cloud-token-by-uuid`  
**Summary:** Get a cloud provider token by UUID.  
**Response 200:** Token object  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-cloud-token-by-uuid

---

### `PATCH /cloud-tokens/{uuid}`
**operationId:** `update-cloud-token-by-uuid`  
**Summary:** Update a cloud provider token name.  
**Body:** `name`  
**Response 200:** `{ "uuid": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/update-cloud-token-by-uuid

---

### `DELETE /cloud-tokens/{uuid}`
**operationId:** `delete-cloud-token-by-uuid`  
**Summary:** Delete a cloud provider token. Fails if used by any servers.  
**Response 200:** `{ "message": "Cloud provider token deleted." }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/delete-cloud-token-by-uuid

---

### `POST /cloud-tokens/{uuid}/validate`
**operationId:** `validate-cloud-token-by-uuid`  
**Summary:** Validate a cloud provider token against the provider API.  
**Response 200:** `{ "valid": bool, "message": string }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/validate-cloud-token-by-uuid

---

## Hetzner

### `GET /hetzner/locations`
**operationId:** `get-hetzner-locations`  
**Summary:** Get all available Hetzner datacenter locations.  
**Query Params:** `cloud_provider_token_uuid` (string)  
**Response 200:** Array of `{ id, name, description, country, city, latitude, longitude }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-hetzner-locations

---

### `GET /hetzner/server-types`
**operationId:** `get-hetzner-server-types`  
**Summary:** Get all available Hetzner server types/sizes.  
**Query Params:** `cloud_provider_token_uuid` (string)  
**Response 200:** Array of server type objects with pricing  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-hetzner-server-types

---

### `GET /hetzner/images`
**operationId:** `get-hetzner-images`  
**Summary:** Get all available Hetzner OS images.  
**Query Params:** `cloud_provider_token_uuid` (string)  
**Response 200:** Array of `{ id, name, description, type, os_flavor, os_version, architecture }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-hetzner-images

---

### `GET /hetzner/ssh-keys`
**operationId:** `get-hetzner-ssh-keys`  
**Summary:** Get all SSH keys stored in a Hetzner account.  
**Query Params:** `cloud_provider_token_uuid` (string)  
**Response 200:** Array of `{ id, name, fingerprint, public_key }`  
**Doc:** https://coolify.io/docs/api-reference/api/operations/get-hetzner-ssh-keys

---

## Resources

### `GET /resources`
**operationId:** `list-resources`  
**Summary:** Get all resources.  
**Response 200:** Resource list  
**Doc:** https://coolify.io/docs/api-reference/api/operations/list-resources

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400` | Invalid token or bad request |
| `401` | Unauthenticated |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (e.g., domain already in use) |
| `422` | Validation error |
| `429` | Rate limit exceeded — check `Retry-After` header |

---

## Security Scheme

```
Type: HTTP Bearer
Header: Authorization: Bearer <token>
```

Tokens are created in **Security → API Tokens** in the Coolify dashboard. Each token is scoped to a single team.
