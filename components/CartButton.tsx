import { images } from '@/constants';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const CartButton = () => {
	const totalItems = 10; // This would be replaced with actual logic to get the cart items count

	return (
		<TouchableOpacity className='cart-btn' onPress={() => console.log('Cart pressed')}>
			<Image source={images.bag} className='size-5' resizeMode='contain' />
			{totalItems > 0 && (
				<View className='cart-badge'>
					<Text className='small-bold text-white'>{totalItems}</Text>
				</View>
			)}
		</TouchableOpacity>
	);
};

export default CartButton;
