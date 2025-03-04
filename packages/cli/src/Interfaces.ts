/* eslint-disable @typescript-eslint/naming-convention */
import type {
	ExecutionError,
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialsEncrypted,
	IDataObject,
	IDeferredPromise,
	IExecuteResponsePromiseData,
	IPinData,
	IRun,
	IRunData,
	IRunExecutionData,
	ITaskData,
	ITelemetrySettings,
	ITelemetryTrackProperties,
	IWorkflowBase as IWorkflowBaseWorkflow,
	CredentialLoadingDetails,
	Workflow,
	WorkflowActivateMode,
	WorkflowExecuteMode,
} from 'n8n-workflow';

import { WorkflowExecute } from 'n8n-core';

import PCancelable from 'p-cancelable';
import type { FindOperator, Repository } from 'typeorm';

import { ChildProcess } from 'child_process';
import { Url } from 'url';

import type { Request } from 'express';
import type { InstalledNodes } from '@db/entities/InstalledNodes';
import type { InstalledPackages } from '@db/entities/InstalledPackages';
import type { Role } from '@db/entities/Role';
import type { Settings } from '@db/entities/Settings';
import type { SharedCredentials } from '@db/entities/SharedCredentials';
import type { SharedWorkflow } from '@db/entities/SharedWorkflow';
import type { TagEntity } from '@db/entities/TagEntity';
import type { User } from '@db/entities/User';
import type { WorkflowEntity } from '@db/entities/WorkflowEntity';

export interface IActivationError {
	time: number;
	error: {
		message: string;
	};
}

export interface IQueuedWorkflowActivations {
	activationMode: WorkflowActivateMode;
	lastTimeout: number;
	timeout: NodeJS.Timeout;
	workflowData: IWorkflowDb;
}

export interface ICustomRequest extends Request {
	parsedUrl: Url | undefined;
}

export interface ICredentialsTypeData {
	[key: string]: CredentialLoadingDetails;
}

export interface ICredentialsOverwrite {
	[key: string]: ICredentialDataDecryptedObject;
}

export interface IDatabaseCollections {
	Credentials: Repository<ICredentialsDb>;
	Execution: Repository<IExecutionFlattedDb>;
	Workflow: Repository<WorkflowEntity>;
	Webhook: Repository<IWebhookDb>;
	Tag: Repository<TagEntity>;
	Role: Repository<Role>;
	User: Repository<User>;
	SharedCredentials: Repository<SharedCredentials>;
	SharedWorkflow: Repository<SharedWorkflow>;
	Settings: Repository<Settings>;
	InstalledPackages: Repository<InstalledPackages>;
	InstalledNodes: Repository<InstalledNodes>;
}

export interface IWebhookDb {
	workflowId: number | string;
	webhookPath: string;
	method: string;
	node: string;
	webhookId?: string;
	pathLength?: number;
}

// ----------------------------------
//               tags
// ----------------------------------

export interface ITagDb {
	id: number;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface ITagToImport {
	id: string | number;
	name: string;
	createdAt?: string;
	updatedAt?: string;
}

export type UsageCount = {
	usageCount: number;
};

export type ITagWithCountDb = ITagDb & UsageCount;

// ----------------------------------
//            workflows
// ----------------------------------

export interface IWorkflowBase extends IWorkflowBaseWorkflow {
	id?: number | string;
}

// Almost identical to editor-ui.Interfaces.ts
export interface IWorkflowDb extends IWorkflowBase {
	id: number | string;
	tags?: ITagDb[];
}

export interface IWorkflowToImport extends IWorkflowBase {
	tags: ITagToImport[];
}

export interface IWorkflowResponse extends IWorkflowBase {
	id: string;
}

// ----------------------------------
//            credentials
// ----------------------------------

export interface ICredentialsBase {
	createdAt: Date;
	updatedAt: Date;
}

export interface ICredentialsDb extends ICredentialsBase, ICredentialsEncrypted {
	id: number | string;
	name: string;
	shared?: SharedCredentials[];
}

export interface ICredentialsResponse extends ICredentialsDb {
	id: string;
}

export interface ICredentialsDecryptedDb extends ICredentialsBase, ICredentialsDecrypted {
	id: number | string;
}

export interface ICredentialsDecryptedResponse extends ICredentialsDecryptedDb {
	id: string;
}

export type DatabaseType = 'mariadb' | 'postgresdb' | 'mysqldb' | 'sqlite';
export type SaveExecutionDataType = 'all' | 'none';

export interface IExecutionBase {
	id?: number | string;
	mode: WorkflowExecuteMode;
	startedAt: Date;
	stoppedAt?: Date; // empty value means execution is still running
	workflowId?: string; // To be able to filter executions easily //
	finished: boolean;
	retryOf?: number | string; // If it is a retry, the id of the execution it is a retry of.
	retrySuccessId?: number | string; // If it failed and a retry did succeed. The id of the successful retry.
}

// Data in regular format with references
export interface IExecutionDb extends IExecutionBase {
	data: IRunExecutionData;
	waitTill?: Date;
	workflowData?: IWorkflowBase;
}

export interface IExecutionPushResponse {
	executionId?: string;
	waitingForWebhook?: boolean;
}

export interface IExecutionResponse extends IExecutionBase {
	id: string;
	data: IRunExecutionData;
	retryOf?: string;
	retrySuccessId?: string;
	waitTill?: Date;
	workflowData: IWorkflowBase;
}

// Flatted data to save memory when saving in database or transferring
// via REST API
export interface IExecutionFlatted extends IExecutionBase {
	data: string;
	workflowData: IWorkflowBase;
}

export interface IExecutionFlattedDb extends IExecutionBase {
	id: number | string;
	data: string;
	waitTill?: Date | null;
	workflowData: Omit<IWorkflowBase, 'pinData'>;
}

export interface IExecutionFlattedResponse extends IExecutionFlatted {
	id: string;
	retryOf?: string;
}

export interface IExecutionResponseApi {
	id: number | string;
	mode: WorkflowExecuteMode;
	startedAt: Date;
	stoppedAt?: Date;
	workflowId?: string;
	finished: boolean;
	retryOf?: number | string;
	retrySuccessId?: number | string;
	data?: object;
	waitTill?: Date | null;
	workflowData: IWorkflowBase;
}
export interface IExecutionsListResponse {
	count: number;
	// results: IExecutionShortResponse[];
	results: IExecutionsSummary[];
	estimated: boolean;
}

export interface IExecutionsStopData {
	finished?: boolean;
	mode: WorkflowExecuteMode;
	startedAt: Date;
	stoppedAt?: Date;
}

export interface IExecutionsSummary {
	id: string;
	finished?: boolean;
	mode: WorkflowExecuteMode;
	retryOf?: string;
	retrySuccessId?: string;
	waitTill?: Date;
	startedAt: Date;
	stoppedAt?: Date;
	workflowId: string;
	workflowName?: string;
}

export interface IExecutionsCurrentSummary {
	id: string;
	retryOf?: string;
	startedAt: Date;
	mode: WorkflowExecuteMode;
	workflowId: string;
}

export interface IExecutionDeleteFilter {
	deleteBefore?: Date;
	filters?: IDataObject;
	ids?: string[];
}

export interface IExecutingWorkflowData {
	executionData: IWorkflowExecutionDataProcess;
	process?: ChildProcess;
	startedAt: Date;
	postExecutePromises: Array<IDeferredPromise<IRun | undefined>>;
	responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>;
	workflowExecution?: PCancelable<IRun>;
}

export interface IExternalHooks {
	credentials?: {
		create?: Array<{
			(this: IExternalHooksFunctions, credentialsData: ICredentialsEncrypted): Promise<void>;
		}>;
		delete?: Array<{ (this: IExternalHooksFunctions, credentialId: string): Promise<void> }>;
		update?: Array<{
			(this: IExternalHooksFunctions, credentialsData: ICredentialsDb): Promise<void>;
		}>;
	};
	workflow?: {
		activate?: Array<{ (this: IExternalHooksFunctions, workflowData: IWorkflowDb): Promise<void> }>;
		create?: Array<{ (this: IExternalHooksFunctions, workflowData: IWorkflowBase): Promise<void> }>;
		delete?: Array<{ (this: IExternalHooksFunctions, workflowId: string): Promise<void> }>;
		execute?: Array<{
			(
				this: IExternalHooksFunctions,
				workflowData: IWorkflowDb,
				mode: WorkflowExecuteMode,
			): Promise<void>;
		}>;
		update?: Array<{ (this: IExternalHooksFunctions, workflowData: IWorkflowDb): Promise<void> }>;
	};
}

export interface IExternalHooksFileData {
	[key: string]: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: Array<(...args: any[]) => Promise<void>>;
	};
}

export interface IExternalHooksFunctions {
	dbCollections: IDatabaseCollections;
}

export interface IExternalHooksClass {
	init(): Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	run(hookName: string, hookParameters?: any[]): Promise<void>;
}

export interface IDiagnosticInfo {
	versionCli: string;
	databaseType: DatabaseType;
	notificationsEnabled: boolean;
	disableProductionWebhooksOnMainProcess: boolean;
	basicAuthActive: boolean;
	systemInfo: {
		os: {
			type?: string;
			version?: string;
		};
		memory?: number;
		cpus: {
			count?: number;
			model?: string;
			speed?: number;
		};
	};
	executionVariables: {
		[key: string]: string | number | boolean | undefined;
	};
	deploymentType: string;
	binaryDataMode: string;
	n8n_multi_user_allowed: boolean;
	smtp_set_up: boolean;
}

export interface ITelemetryUserDeletionData {
	user_id: string;
	target_user_old_status: 'active' | 'invited';
	migration_strategy?: 'transfer_data' | 'delete_data';
	target_user_id?: string;
	migration_user_id?: string;
}

export interface IInternalHooksClass {
	onN8nStop(): Promise<void>;
	onServerStarted(
		diagnosticInfo: IDiagnosticInfo,
		firstWorkflowCreatedAt?: Date,
	): Promise<unknown[]>;
	onPersonalizationSurveySubmitted(userId: string, answers: Record<string, string>): Promise<void>;
	onWorkflowCreated(userId: string, workflow: IWorkflowBase, publicApi: boolean): Promise<void>;
	onWorkflowDeleted(userId: string, workflowId: string, publicApi: boolean): Promise<void>;
	onWorkflowSaved(userId: string, workflow: IWorkflowBase, publicApi: boolean): Promise<void>;
	onWorkflowPostExecute(
		executionId: string,
		workflow: IWorkflowBase,
		runData?: IRun,
		userId?: string,
	): Promise<void>;
	onUserDeletion(
		userId: string,
		userDeletionData: ITelemetryUserDeletionData,
		publicApi: boolean,
	): Promise<void>;
	onUserInvite(userInviteData: { user_id: string; target_user_id: string[] }): Promise<void>;
	onUserReinvite(userReinviteData: { user_id: string; target_user_id: string }): Promise<void>;
	onUserUpdate(userUpdateData: { user_id: string; fields_changed: string[] }): Promise<void>;
	onUserInviteEmailClick(userInviteClickData: { user_id: string }): Promise<void>;
	onUserPasswordResetEmailClick(userPasswordResetData: { user_id: string }): Promise<void>;
	onUserTransactionalEmail(userTransactionalEmailData: {
		user_id: string;
		message_type: 'Reset password' | 'New user invite' | 'Resend invite';
	}): Promise<void>;
	onUserPasswordResetRequestClick(userPasswordResetData: { user_id: string }): Promise<void>;
	onInstanceOwnerSetup(instanceOwnerSetupData: { user_id: string }): Promise<void>;
	onUserSignup(userSignupData: { user_id: string }): Promise<void>;
}

export interface IN8nConfig {
	database: IN8nConfigDatabase;
	endpoints: IN8nConfigEndpoints;
	executions: IN8nConfigExecutions;
	generic: IN8nConfigGeneric;
	host: string;
	nodes: IN8nConfigNodes;
	port: number;
	protocol: 'http' | 'https';
}

export interface IN8nConfigDatabase {
	type: DatabaseType;
	postgresdb: {
		host: string;
		password: string;
		port: number;
		user: string;
	};
}

export interface IN8nConfigEndpoints {
	rest: string;
	webhook: string;
	webhookTest: string;
}

// eslint-disable-next-line import/export
export interface IN8nConfigExecutions {
	saveDataOnError: SaveExecutionDataType;
	saveDataOnSuccess: SaveExecutionDataType;
	saveDataManualExecutions: boolean;
}

// eslint-disable-next-line import/export
export interface IN8nConfigExecutions {
	saveDataOnError: SaveExecutionDataType;
	saveDataOnSuccess: SaveExecutionDataType;
	saveDataManualExecutions: boolean;
}

export interface IN8nConfigGeneric {
	timezone: string;
}

export interface IN8nConfigNodes {
	errorTriggerType: string;
	exclude: string[];
}

export interface IVersionNotificationSettings {
	enabled: boolean;
	endpoint: string;
	infoUrl: string;
}

export interface IN8nUISettings {
	endpointWebhook: string;
	endpointWebhookTest: string;
	saveDataErrorExecution: string;
	saveDataSuccessExecution: string;
	saveManualExecutions: boolean;
	executionTimeout: number;
	maxExecutionTimeout: number;
	workflowCallerPolicyDefaultOption: 'any' | 'none' | 'workflowsFromAList';
	oauthCallbackUrls: {
		oauth1: string;
		oauth2: string;
	};
	timezone: string;
	urlBaseWebhook: string;
	urlBaseEditor: string;
	versionCli: string;
	n8nMetadata?: {
		[key: string]: string | number | undefined;
	};
	versionNotifications: IVersionNotificationSettings;
	instanceId: string;
	telemetry: ITelemetrySettings;
	personalizationSurveyEnabled: boolean;
	defaultLocale: string;
	userManagement: IUserManagementSettings;
	publicApi: IPublicApiSettings;
	workflowTagsDisabled: boolean;
	logLevel: 'info' | 'debug' | 'warn' | 'error' | 'verbose' | 'silent';
	hiringBannerEnabled: boolean;
	templates: {
		enabled: boolean;
		host: string;
	};
	onboardingCallPromptEnabled: boolean;
	missingPackages?: boolean;
	executionMode: 'regular' | 'queue';
	communityNodesEnabled: boolean;
	deployment: {
		type: string;
	};
	isNpmAvailable: boolean;
	allowedModules: {
		builtIn?: string;
		external?: string;
	};
	enterprise: {
		sharing: boolean;
		workflowSharing: boolean;
	};
}

export interface IPersonalizationSurveyAnswers {
	codingSkill: string | null;
	companyIndustry: string[];
	companySize: string | null;
	otherCompanyIndustry: string | null;
	otherWorkArea: string | null;
	workArea: string[] | string | null;
}

export interface IUserSettings {
	isOnboarded?: boolean;
}

export interface IUserManagementSettings {
	enabled: boolean;
	showSetupOnFirstLoad?: boolean;
	smtpSetup: boolean;
}
export interface IPublicApiSettings {
	enabled: boolean;
	latestVersion: number;
	path: string;
}

export interface IPackageVersions {
	cli: string;
}

export type IPushDataType = IPushData['type'];

export type IPushData =
	| PushDataExecutionFinished
	| PushDataExecutionStarted
	| PushDataExecuteAfter
	| PushDataExecuteBefore
	| PushDataConsoleMessage
	| PushDataReloadNodeType
	| PushDataRemoveNodeType
	| PushDataTestWebhook;

type PushDataExecutionFinished = {
	data: IPushDataExecutionFinished;
	type: 'executionFinished';
};

type PushDataExecutionStarted = {
	data: IPushDataExecutionStarted;
	type: 'executionStarted';
};

type PushDataExecuteAfter = {
	data: IPushDataNodeExecuteAfter;
	type: 'nodeExecuteAfter';
};

type PushDataExecuteBefore = {
	data: IPushDataNodeExecuteBefore;
	type: 'nodeExecuteBefore';
};

type PushDataConsoleMessage = {
	data: IPushDataConsoleMessage;
	type: 'sendConsoleMessage';
};

type PushDataReloadNodeType = {
	data: IPushDataReloadNodeType;
	type: 'reloadNodeType';
};

type PushDataRemoveNodeType = {
	data: IPushDataRemoveNodeType;
	type: 'removeNodeType';
};

type PushDataTestWebhook = {
	data: IPushDataTestWebhook;
	type: 'testWebhookDeleted' | 'testWebhookReceived';
};

export interface IPushDataExecutionFinished {
	data: IRun;
	executionId: string;
	retryOf?: string;
}

export interface IPushDataExecutionStarted {
	executionId: string;
	mode: WorkflowExecuteMode;
	startedAt: Date;
	retryOf?: string;
	workflowId: string;
	workflowName?: string;
}

export interface IPushDataNodeExecuteAfter {
	data: ITaskData;
	executionId: string;
	nodeName: string;
}

export interface IPushDataNodeExecuteBefore {
	executionId: string;
	nodeName: string;
}

export interface IPushDataReloadNodeType {
	name: string;
	version: number;
}

export interface IPushDataRemoveNodeType {
	name: string;
	version: number;
}

export interface IPushDataTestWebhook {
	executionId: string;
	workflowId: string;
}

export interface IPushDataConsoleMessage {
	source: string;
	message: string;
}

export interface IResponseCallbackData {
	data?: IDataObject | IDataObject[];
	headers?: object;
	noWebhookResponse?: boolean;
	responseCode?: number;
}

export interface INodesTypeData {
	[key: string]: {
		className: string;
		sourcePath: string;
	};
}

export interface IWorkflowErrorData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
	execution?: {
		id?: string;
		url?: string;
		retryOf?: string;
		error: ExecutionError;
		lastNodeExecuted: string;
		mode: WorkflowExecuteMode;
	};
	trigger?: {
		error: ExecutionError;
		mode: WorkflowExecuteMode;
	};
	workflow: {
		id?: string;
		name: string;
	};
}

export interface IProcessMessageDataHook {
	hook: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parameters: any[];
}

export interface IWorkflowExecutionDataProcess {
	destinationNode?: string;
	executionMode: WorkflowExecuteMode;
	executionData?: IRunExecutionData;
	runData?: IRunData;
	pinData?: IPinData;
	retryOf?: number | string;
	sessionId?: string;
	startNodes?: string[];
	workflowData: IWorkflowBase;
	userId: string;
}

export interface IWorkflowExecutionDataProcessWithExecution extends IWorkflowExecutionDataProcess {
	executionId: string;
	userId: string;
}

export interface IWorkflowExecuteProcess {
	startedAt: Date;
	workflow: Workflow;
	workflowExecute: WorkflowExecute;
}

export type WhereClause = Record<string, { [key: string]: string | FindOperator<unknown> }>;

// ----------------------------------
//          community nodes
// ----------------------------------

export namespace CommunityPackages {
	export type ParsedPackageName = {
		packageName: string;
		rawString: string;
		scope?: string;
		version?: string;
	};

	export type AvailableUpdates = {
		[packageName: string]: {
			current: string;
			wanted: string;
			latest: string;
			location: string;
		};
	};

	export type PackageStatusCheck = {
		status: 'OK' | 'Banned';
		reason?: string;
	};
}

// ----------------------------------
//               telemetry
// ----------------------------------

export interface IExecutionTrackProperties extends ITelemetryTrackProperties {
	workflow_id: string;
	success: boolean;
	error_node_type?: string;
	is_manual: boolean;
}
