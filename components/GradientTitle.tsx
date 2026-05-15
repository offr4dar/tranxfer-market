import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'

const TITLE_SIZE = 50
const TITLE_LH   = TITLE_SIZE * 1.2
const TITLE_GAP  = -8

interface Props {
  text: string
  size?: number
}

export default function GradientTitle({ text, size = TITLE_SIZE }: Props) {
  const lines = text.split('\n')
  const lineHeight = size * 1.2
  
  if (Platform.OS === 'web') {
    return (
      <View>
        {lines.map((l, i) => (
          <Text
            key={i}
            style={[
              styles.text, 
              { fontSize: size, lineHeight },
              i < lines.length - 1 && { marginBottom: TITLE_GAP }, 
              {
                background: 'linear-gradient(214deg, #ffffff 31%, #82c3a5 92%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              } as any
            ]}
          >
            {l}
          </Text>
        ))}
      </View>
    )
  }

  return (
    <View style={{ alignSelf: 'stretch' }}>
      {lines.map((l, i) => (
        <MaskedView
          key={i}
          style={[
            { height: lineHeight }, 
            i < lines.length - 1 && { marginBottom: TITLE_GAP }
          ]}
          maskElement={
            <View style={{ backgroundColor: 'transparent', height: lineHeight, justifyContent: 'center' }}>
              <Text style={[styles.text, { fontSize: size, lineHeight }]}>{l}</Text>
            </View>
          }
        >
          <LinearGradient
            colors={['#ffffff', '#82c3a5']}
            start={{ x: 0.7, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ width: '100%', height: lineHeight }}
          />
        </MaskedView>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Anton_400Regular',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
