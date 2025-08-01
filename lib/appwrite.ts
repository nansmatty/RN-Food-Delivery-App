import { Category, CreateUserParams, GetMenuParams, MenuItem, SignInParams, User } from '@/type';
import { Account, Avatars, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

export const appwriteConfig = {
	endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
	projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
	platform: 'com.ndev.foodordering',
	databaseId: '688a0ee8002a354d7742',
	bucketId: '688c81bd001d8e4d2de1',
	userCollectionId: '688a0f190033f95ff4ea',
	categoriesCollectionId: '688c76b800120affe610',
	menuCollectionId: '688c77a9003067af609f',
	customizationsCollectionId: '688c79210014b9620ac2',
	menuCustomizationsCollectionId: '688c80a2003a2cd93713',
};

export const client = new Client();

client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId).setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
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

		const currentUser = await databases.listDocuments<User>(appwriteConfig.databaseId, appwriteConfig.userCollectionId, [
			Query.equal('accountId', currentAccount.$id),
		]);

		if (!currentUser) throw Error;

		return currentUser.documents[0];
	} catch (e) {
		console.log(e);
		throw new Error(e as string);
	}
};

export const getMenu = async ({ category, query }: GetMenuParams) => {
	try {
		const queries: string[] = [];

		if (category) queries.push(Query.equal('categories', category));
		if (query) queries.push(Query.search('name', query));

		const menu = await databases.listDocuments<MenuItem>(appwriteConfig.databaseId, appwriteConfig.menuCollectionId, queries);

		return menu.documents;
	} catch (error) {
		throw new Error(error as string);
	}
};

export const getCategories = async () => {
	try {
		const categories = await databases.listDocuments<Category>(appwriteConfig.databaseId, appwriteConfig.categoriesCollectionId);
		return categories.documents;
	} catch (error) {
		throw new Error(error as string);
	}
};
