import React from "react";
import { Box, Drawer } from "@mui/material";

const DRAWER_MAX_WIDTH = 1180;

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
      sx={sx}
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
                "radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.12), transparent 34%), rgba(2, 6, 23, 0.72)",
              backdropFilter: "blur(10px)",
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
          {
            width: {
              xs: "100vw",
              sm: "min(92vw, 760px)",
              lg: `min(92vw, ${DRAWER_MAX_WIDTH}px)`,
            },
            maxWidth: "100vw",
            height: {
              xs: "100dvh",
              sm: "calc(100dvh - 24px)",
            },
            maxHeight: {
              xs: "100dvh",
              sm: "calc(100dvh - 24px)",
            },
            my: {
              xs: 0,
              sm: "12px",
            },
            borderRadius: {
              xs: 0,
              sm: "28px 0 0 28px",
            },
            overflow: "hidden",
            borderLeft: "1px solid rgba(103, 232, 249, 0.18)",
            background:
              "radial-gradient(circle at top left, rgba(34, 211, 238, 0.16), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
            boxShadow:
              "-28px 0 80px -42px rgba(34, 211, 238, 0.62), inset 1px 0 0 rgba(255,255,255,0.06)",
          },
          paperSx,
        ],
      }}
    >
      {children}
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
        borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
        background:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
        backdropFilter: "blur(18px)",
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
      },
      sx,
    ]}
  >
    {children}
  </Box>
);
