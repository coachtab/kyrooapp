import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

interface Action {
  text: string;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void;
}

interface SheetOptions {
  title?: string;
  message?: string;
  actions: Action[];
}

interface ActionSheetCtx {
  show: (opts: SheetOptions) => void;
  confirm: (opts: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
}

const Ctx = createContext<ActionSheetCtx>({
  show: () => {},
  confirm: () => Promise.resolve(false),
});

export function ActionSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<SheetOptions | null>(null);
  const slideY = useState(() => new Animated.Value(400))[0];
  const backdrop = useState(() => new Animated.Value(0))[0];

  const open = useCallback((o: SheetOptions) => {
    setOpts(o);
    setVisible(true);
    slideY.setValue(400);
    backdrop.setValue(0);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 280 }),
      Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [slideY, backdrop]);

  const close = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 400, duration: 180, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setOpts(null);
      cb?.();
    });
  }, [slideY, backdrop]);

  const show = useCallback((o: SheetOptions) => open(o), [open]);

  const confirm = useCallback((o: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }): Promise<boolean> => {
    return new Promise(resolve => {
      open({
        title: o.title,
        message: o.message,
        actions: [
          {
            text: o.confirmText || 'OK',
            style: o.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
          { text: o.cancelText || 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        ],
      });
    });
  }, [open]);

  const handleAction = (action: Action) => {
    close(action.onPress);
  };

  const cancelAction = opts?.actions.find(a => a.style === 'cancel');
  const mainActions = opts?.actions.filter(a => a.style !== 'cancel') ?? [];

  return (
    <Ctx.Provider value={{ show, confirm }}>
      {children}
      {visible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View
            style={[as.backdrop, { opacity: backdrop }]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => close(cancelAction?.onPress)}
            />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[as.sheet, { transform: [{ translateY: slideY }] }]}
          >
            {/* Main group */}
            <View style={as.group}>
              {(opts?.title || opts?.message) && (
                <View style={as.header}>
                  {opts?.title && <Text style={as.title}>{opts.title}</Text>}
                  {opts?.message && <Text style={as.message}>{opts.message}</Text>}
                </View>
              )}
              {mainActions.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    as.actionBtn,
                    i === 0 && (opts?.title || opts?.message) && as.actionBtnFirst,
                    i < mainActions.length - 1 && as.actionBtnBorder,
                  ]}
                  onPress={() => handleAction(action)}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    as.actionText,
                    action.style === 'destructive' && as.destructiveText,
                  ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel — separated */}
            {cancelAction && (
              <TouchableOpacity
                style={as.cancelBtn}
                onPress={() => handleAction(cancelAction)}
                activeOpacity={0.6}
              >
                <Text style={as.cancelText}>{cancelAction.text}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      )}
    </Ctx.Provider>
  );
}

export const useActionSheet = () => useContext(Ctx);

const { width: SCREEN_W } = Dimensions.get('window');

const as = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: SCREEN_W > 500 ? 80 : 8,
    paddingBottom:     Platform.OS === 'web' ? 20 : 34,
  },
  group: {
    backgroundColor: '#2C2C2E',
    borderRadius:    14,
    overflow:        'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop:        16,
    paddingBottom:     14,
    alignItems:        'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  title: {
    fontSize:     13,
    fontWeight:   '600',
    color:        '#98989F',
    textAlign:    'center',
    marginBottom: 4,
  },
  message: {
    fontSize:   13,
    color:      '#98989F',
    textAlign:  'center',
    lineHeight: 18,
  },
  actionBtn: {
    paddingVertical: 18,
    alignItems:      'center',
  },
  actionBtnFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
  },
  actionBtnBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  actionText: {
    fontSize:   20,
    color:      '#0A84FF',
    fontWeight: '400',
  },
  destructiveText: {
    color: '#FF453A',
  },
  cancelBtn: {
    backgroundColor: '#2C2C2E',
    borderRadius:    14,
    paddingVertical: 18,
    alignItems:      'center',
    marginTop:       8,
  },
  cancelText: {
    fontSize:   20,
    fontWeight: '600',
    color:      '#0A84FF',
  },
});
