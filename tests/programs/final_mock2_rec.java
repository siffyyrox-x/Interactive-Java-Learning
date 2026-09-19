public class Main {
 public static void main(String[] args) {
     int[] a = {18, 7, 11, 5};
     System.out.println(calc(a, a.length - 1));
 }
 static int calc(int[] a, int i) {
     if (i == 0) return a[0];
     int x = calc(a, i - 1);
     System.out.println(x + a[i]);
     if (a[i] < x) return a[i];
     else return x;
 }
}
