import React from "react";
import { Box, Drawer } from "@mui/material";

const DRAWER_MAX_WIDTH = 940;

type SelectorDrawerRootProps = React.PropsWithChildren<{
  open: boolean;
  onClose?: React.ComponentProps<typeof Drawer>["onClose"];
  PaperProps?: React.ComponentProps<typeof Drawer>["PaperProps"];
  BackdropProps?: NonNullable<
    React.ComponentProps<typeof Drawer>["ModalProps"]
  >["BackdropProps"];
  ModalProps?: React.ComponentProps<typeof Drawer>["ModalProps"];
  keepMounted?: boolean;
  maxWidth?: unknown;
  fullWidth?: boolean;
  scroll?: "paper" | "body";
  sx?: React.ComponentProps<typeof Drawer>["sx"];
  className?: string;
  disableEscapeKeyDown?: boolean;
  TransitionProps?: unknown;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}>;

export const PlaylistSelectorDrawerRoot = ({
  open,
  onClose,
  children,
  PaperProps,
  BackdropProps,
  ModalProps,
  keepMounted,
  maxWidth: _maxWidth,
  fullWidth: _fullWidth,
  scroll: _scroll,
  TransitionProps: _TransitionProps,
  sx,
  disableEscapeKeyDown,
  className,
  ...drawerProps
}: SelectorDrawerRootProps) => {
  const {
    sx: paperSx,
    className: paperClassName,
    ...restPaperProps
  } = PaperProps ?? {};

  const { sx: backdropSx, ...restBackdropProps } = BackdropProps ?? {};

  return (
    <Drawer
      {...drawerProps}
      anchor="right"
      open={open}
      onClose={onClose}
      keepMounted={keepMounted}
      className={className}
      sx={[
        {
          "& .MuiDrawer-paper": {
            backgroundImage: "none",
          },
        },
        sx,
      ]}
      ModalProps={{
        ...ModalProps,
        disableEscapeKeyDown:
          disableEscapeKeyDown ?? ModalProps?.disableEscapeKeyDown,
        BackdropProps: {
          ...ModalProps?.BackdropProps,
          ...restBackdropProps,
          sx: [
            {
              background:
                "linear-gradient(90deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.52))",
              backdropFilter: "blur(8px)",
            },
            ModalProps?.BackdropProps?.sx,
            backdropSx,
          ],
        },
      }}
      PaperProps={{
        ...restPaperProps,
        className: paperClassName,
        sx: [
          /**
           * Put caller Paper sx first.
           * Old Dialog styles may still pass width / height / borderRadius.
           * Drawer defaults below intentionally override those Dialog-era styles.
           */
          paperSx,
          {
            width: {
              xs: "100vw",
              sm: "min(94vw, 680px)",
              md: "min(90vw, 820px)",
              lg: `min(82vw, ${DRAWER_MAX_WIDTH}px)`,
            },
            maxWidth: "100vw",
            height: {
              xs: "100dvh",
              sm: "calc(100dvh - 16px)",
            },
            maxHeight: {
              xs: "100dvh",
              sm: "calc(100dvh - 16px)",
            },
            marginTop: {
              xs: 0,
              sm: "8px",
            },
            marginBottom: {
              xs: 0,
              sm: "8px",
            },
            borderRadius: {
              xs: 0,
              sm: "22px 0 0 22px",
            },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            overscrollBehavior: "contain",
            borderLeft: {
              xs: "none",
              sm: "1px solid rgba(148, 163, 184, 0.18)",
            },
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.99), rgba(2, 6, 23, 0.99))",
            boxShadow:
              "-22px 0 72px -44px rgba(15, 23, 42, 0.95), inset 1px 0 0 rgba(255, 255, 255, 0.055)",
          },
        ],
      }}
    >
      <Box
        component="div"
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.13), transparent 34%), radial-gradient(circle at 100% 18%, rgba(59, 130, 246, 0.1), transparent 32%)",
        }}
      />

      <Box
        component="div"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          minHeight: 0,
          height: "100%",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Drawer>
  );
};

type SelectorDrawerTitleProps = React.PropsWithChildren<{
  id?: string;
  className?: string;
  sx?: React.ComponentProps<typeof Box>["sx"];
}>;

export const PlaylistSelectorDrawerTitle = ({
  children,
  className,
  sx,
  ...rest
}: SelectorDrawerTitleProps) => (
  <Box
    component="div"
    {...rest}
    className={className}
    sx={[
      {
        flex: "0 0 auto",
        borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
        background:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.84))",
        backdropFilter: "blur(18px)",
        position: "relative",
        zIndex: 2,
      },
      sx,
    ]}
  >
    {children}
  </Box>
);

type SelectorDrawerContentProps = React.PropsWithChildren<{
  className?: string;
  sx?: React.ComponentProps<typeof Box>["sx"];
  dividers?: boolean;
}>;

export const PlaylistSelectorDrawerContent = ({
  children,
  className,
  sx,
  dividers: _dividers,
  ...rest
}: SelectorDrawerContentProps) => (
  <Box
    component="div"
    {...rest}
    className={className}
    sx={[
      {
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      },
      sx,
    ]}
  >
    {children}
  </Box>
);
