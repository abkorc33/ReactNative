import React from 'react'
import type { ReactNode, FC, ComponentProps } from 'react'
import { Platform, View, Animated, StyleSheet } from 'react-native'

import type { GestureResponderEvent, PanResponderGestureState } from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import { useScrollEnabled } from '../contexts'
import { useLayout, useAnimatedValue, useToggle, useTransformStyle, usePanResponder } from '../hooks'

type Event = GestureResponderEvent
type State = PanResponderGestureState

const ios = Platform.OS === 'ios'

type SwipeComponent = (setLayout: (e: LayoutChangeEvent) => void) => ReactNode

export type LeftSwipeProps = ComponentProps<typeof View> & {
    left?: SwipeComponent
}

export const LeftSwipe: FC<LeftSwipeProps> = ({
    left, children, style, ...viewProps }) => {
    const [scrollEnabled, setScrollEnabled] = useScrollEnabled()
    const [{ width: leftWidth }, setLayout] = useLayout()

    const translateX = useAnimatedValue(0)

    const transformStyle = useTransformStyle({
        translateX: translateX.interpolate({
            inputRange: [0, leftWidth],
            outputRange: [-leftWidth, 0]
        })
    }, [leftWidth])

    const [show, toggleShow] = useToggle()
    const PanResponder = usePanResponder({
        onPanResponderGrant() {
            ios && setScrollEnabled(false)
        },
        onPanResponderMove(e: Event, s: State) {
            const { dx } = s
            if (!show && dx < 0) {
                return
            }
            translateX.setValue(dx)
        },
        onPanResponderRelease(e: Event, s: State) {
            ios && setScrollEnabled(true)

            const { dx } = s
            if (!show && dx < 0) {
                return
            }

            Animated.spring(translateX, {
                useNativeDriver: false,
                toValue: show ? 0 : leftWidth
            }).start(toggleShow)
        }
    }, [show, leftWidth])

    return (
        <Animated.View style={[transformStyle, styles.animViewStyle, style]}
            {...viewProps}>
            {left && left(setLayout)}
            <View style={[{ width: '100%' }]} {...PanResponder.panHandlers}>
                {children}
            </View>
        </Animated.View>
    )
}
const styles = StyleSheet.create({
    animViewStyle: { flexDirection: 'row', width: '100%' }
})