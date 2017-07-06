'use strict';

import React from 'react'
import ImageCacheProvider from './ImageCacheProvider'
import { StyleSheet, Image, Animated, View, ActivityIndicator } from 'react-native'
import isEqual from 'lodash/isEqual'

const styles = StyleSheet.create({
  activityContainer:{
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  }
})


export default class CachedImage extends React.PureComponent{

  constructor(props){
    super(props)
    this.state = {
      isCacheable: true,
      cachedImagePath: null,
      scale: new Animated.Value(0)
    }
  }

  safeSetState = (newState) => {
    if (!this.mounted) {
      return
    } else {
      this.setState(newState)
    }
  }

  componentWillMount(){
    this.mounted = true
    this.processSource(this.props.source)
  }

  componentWillUnmount(){ this.mounted = false }

  componentWillReceiveProps(nextProps){
    if ( !isEqual(this.props.source, nextProps.source) ) {
      if (this.props.animated) {
        this.safeSetState({ isCacheable: true, cachedImagePath:null, scale: new Animated.Value(0) })
      } else {
        this.safeSetState({ isCacheable: true, cachedImagePath:null })
      }
      this.processSource(nextProps.source)
    }
  }

  componentDidUpdate(prevProps, prevState){
    if (this.props.animated) {
      if (!prevState.cachedImagePath && this.state.cachedImagePath) {
        this.animateIn()
      }
    }
  }

  processSource = (source) => {
    const url = (source.uri) ? source.uri:null
    const options = {useQueryParamsInCacheKey: false}
    if (ImageCacheProvider.isCacheable(url)) {
      ImageCacheProvider.getCachedImagePath(url,options)
      .catch(() => ImageCacheProvider.cacheImage(url, options, () => Promise.resolve({})))
      .then((res) => this.safeSetState({ cachedImagePath:res, isCacheable:true }))
      .catch((e) => this.safeSetState({ cachedImagePath: null, isCacheable: false }))
    } else {
      this.safeSetState({ isCacheable: false })
    }
  }

  animatedStyles = () => ({
    transform:[{
      scale: this.state.scale.interpolate({
          inputRange: [0,.5,1],
          outputRange: [.01,1.3,1]
      })
    }],
    opacity: this.state.scale.interpolate({
      inputRange: [0,.5,1],
      outputRange: [0,0,1]
    })
  })

  animateIn = () => Animated.spring(this.state.scale,{toValue:1,friction:2}).start()

  render(){
    const { source, style, animated, tintColor, activityIndicatorColor, ...rest } = this.props
    const tint = (tintColor) ? {tintColor}:null
    const ImageDisplay = (animated) ? Animated.Image:Image
    const imageStyle = (animated) ? [style,this.animatedStyles()]:style

    const imageSource = (this.state.isCacheable && this.state.cachedImagePath) ? {uri: `file://${this.state.cachedImagePath}`}:source

    if (this.state.isCacheable && !this.state.cachedImagePath) {
      return(
        <View style={[ style, styles.activityContainer ]}>
          <ActivityIndicator color={ activityIndicatorColor } />
        </View>
      )
    } else {
      return(
        <ImageDisplay
          source={ imageSource }
          style={[ imageStyle, tint ]}
          { ...rest }
        />
      )
    }
  }

}
