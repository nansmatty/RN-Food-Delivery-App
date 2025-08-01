import { CreateUserParams, SignInParams } from '@/type';
import { Account, Avatars, Client, Databases, ID, Query } from 'react-native-appwrite';

export const appwriteConfig = {
	endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
	projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
	platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!,
	databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
	bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!,
	userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID!,
	categoryCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
	menuCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_COLLECTION_ID!,
	customizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CUSTOMIZATIONS_COLLECTION_ID!,
	menuCustomizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_CUSTOMIZATIONS_COLLECTION_ID!,
};

export const client = new Client();

client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId).setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
	try {
		const newAccount = await account.create(ID.unique(), email, password, name);
		if (!newAccount) throw new Error('User creation failed');
		await signIn({ email, password });

		const newuser = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.userCollectionId, ID.unique(), {
			accountId: newAccount.$id,
			email,
			name,
			avatar: avatars.getInitialsURL(name),
		});

		return newuser;
	} catch (error) {
		throw new Error(error as string);
	}
};

export const signIn = async ({ email, password }: SignInParams) => {
	try {
		await account.createEmailPasswordSession(email, password);
	} catch (error) {
		throw new Error(error as string);
	}
};

export const getCurrentUser = async () => {
	try {
		const currentAccount = await account.get();
		if (!currentAccount) throw Error;

		const currentUser = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userCollectionId, [
			Query.equal('accountId', currentAccount.$id),
		]);

		if (!currentUser) throw Error;

		return currentUser.documents[0];
	} catch (e) {
		console.log(e);
		throw new Error(e as string);
	}
};
