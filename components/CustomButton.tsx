import { CustomButtonProps } from '@/type';
import clsx from 'clsx';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const CustomButton = ({ onPress, title = 'Click Me', style, leftIcon, textStyle, isLoading = false }: CustomButtonProps) => {
	return (
		<TouchableOpacity className={clsx('custom-btn', style)} onPress={onPress}>
			{leftIcon}
			<View className='flex-center flex-row'>
				{isLoading ? (
					<ActivityIndicator size={'small'} color='white' />
				) : (
					<Text className={clsx('text-white-100 paragraph-bold', textStyle)}>{title}</Text>
				)}
			</View>
		</TouchableOpacity>
	);
};

export default CustomButton;
